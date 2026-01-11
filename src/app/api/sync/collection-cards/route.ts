
import { NextRequest } from "next/server";
import { db } from "@/db";
import { collections, cards, collectionItems, sets } from "@/db/schema";
import { eq, and, like, inArray, sql } from "drizzle-orm";
import { fetchSetCardsDetailed, transformCardToSchema, fetchCardsByRarity, fetchCardsByCategory, fetchDetailedCards } from "@/services/tcgdex";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos

/**
 * Endpoint para hidratar (sincronizar) una colección automática
 * GET /api/sync/collection-cards?id=COLLECTION_ID
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("id");
    const encoder = new TextEncoder();

    if (!collectionId) {
        return new Response("Missing collection id", { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            let processedCount = 0;

            try {
                sendEvent({ status: "starting", message: "Analizando colección..." });

                // 1. Obtener la colección y sus filtros
                const collection = await db.query.collections.findFirst({
                    where: eq(collections.id, collectionId),
                });

                if (!collection || collection.type !== "auto" || !collection.filters) {
                    throw new Error("Colección no válida o sin filtros automáticos.");
                }

                const filters = JSON.parse(collection.filters);

                // Determinar modo de carga
                let apiCards: any[] = [];

                if (filters.set) {
                    sendEvent({ status: "progress", message: `Conectando con TCGdex para el set ${filters.set}...`, count: 0, total: 0 });
                    const { set: fullSetData, cards: c } = await fetchSetCardsDetailed(filters.set);

                    if (fullSetData) {
                        // Upsert inmediato del set principal
                        await db.insert(sets).values({
                            id: fullSetData.id,
                            name: fullSetData.name,
                            series: fullSetData.serie?.name || "Unknown",
                            printedTotal: fullSetData.cardCount.official,
                            total: fullSetData.cardCount.total,
                            releaseDate: fullSetData.releaseDate || null,
                            images: JSON.stringify({
                                symbol: fullSetData.symbol ? `${fullSetData.symbol}.webp` : null,
                                logo: fullSetData.logo ? `${fullSetData.logo}.webp` : null,
                            }),
                            syncedAt: new Date()
                        }).onConflictDoUpdate({
                            target: sets.id,
                            set: {
                                name: fullSetData.name,
                                images: JSON.stringify({
                                    symbol: fullSetData.symbol ? `${fullSetData.symbol}.webp` : null,
                                    logo: fullSetData.logo ? `${fullSetData.logo}.webp` : null,
                                }),
                                syncedAt: new Date()
                            }
                        });
                    }
                    apiCards = c;

                } else if (filters.rarity) {
                    sendEvent({ status: "progress", message: `Buscando cartas con rareza ${filters.rarity}...`, count: 0, total: 0 });
                    const briefCards = await fetchCardsByRarity(filters.rarity);
                    apiCards = await fetchDetailedCards(briefCards);

                } else if (filters.supertype) {
                    sendEvent({ status: "progress", message: `Buscando cartas de tipo ${filters.supertype}...`, count: 0, total: 0 });
                    const briefCards = await fetchCardsByCategory(filters.supertype);
                    apiCards = await fetchDetailedCards(briefCards);

                } else if (filters.name) {
                    // Fallback para búsqueda por nombre global si se implementa en UI
                    throw new Error("Sincronización global por nombre no soportada aún. Usa Filtro por Set.");
                } else {
                    throw new Error("Filtros de colección no válidos para sincronización.");
                }

                if (apiCards.length === 0) {
                    sendEvent({ status: "complete", message: "No se encontraron cartas.", count: 0, total: 0 });
                    controller.close();
                    return;
                }

                console.log(`[CollectionSync] Found ${apiCards.length} cards`);

                // 3. Filtrar las cartas según los criterios de la colección (Rarity, Name, etc)
                const filteredApiCards = apiCards.filter(card => {
                    let match = true;
                    // Strict filtering
                    if (filters.set && card.set.id !== filters.set) match = false;
                    if (filters.rarity && card.rarity?.toLowerCase() !== filters.rarity.toLowerCase()) match = false;
                    if (filters.name && card.name.toLowerCase() !== filters.name.toLowerCase()) match = false;
                    if (filters.supertype && card.category.toLowerCase() !== filters.supertype.toLowerCase()) match = false;
                    return match;
                });

                const totalToSync = filteredApiCards.length;
                console.log(`[CollectionSync] ${totalToSync} cards match collection filters`);

                sendEvent({
                    status: "progress",
                    message: `Encontradas ${totalToSync} cartas coincidentes. Verificando sets...`,
                    count: 0,
                    total: totalToSync
                });

                // 4. Pre-Procesar Sets: Asegurar que existen para evitar FK Errors
                const uniqueSetIds = new Set(filteredApiCards.map((c: any) => c.set.id));

                for (const sId of uniqueSetIds) {
                    // Try to use embedded set info if available
                    const sampleCard = filteredApiCards.find((c: any) => c.set.id === sId);
                    // Cast to string safe
                    const safeSetId = sId as string;

                    if (sampleCard && sampleCard.set) {
                        await db.insert(sets).values({
                            id: safeSetId,
                            name: sampleCard.set.name || "Unknown Set",
                            series: "Unknown",
                            printedTotal: sampleCard.set.cardCount?.official || 0,
                            total: sampleCard.set.cardCount?.total || 0,
                            syncedAt: new Date(),
                            images: JSON.stringify({
                                symbol: sampleCard.set.symbol ? `${sampleCard.set.symbol}.webp` : null,
                                logo: sampleCard.set.logo ? `${sampleCard.set.logo}.webp` : null,
                            })
                        }).onConflictDoNothing();
                    }
                }

                sendEvent({
                    status: "progress",
                    message: `Guardando ${totalToSync} cartas...`,
                    count: 0,
                    total: totalToSync
                });


                for (const card of filteredApiCards) {
                    const cardData = transformCardToSchema(card);

                    await db.insert(cards).values(cardData)
                        .onConflictDoUpdate({
                            target: cards.id,
                            set: {
                                ...cardData, // Actualizar todo para tener datos frescos (precios, imágenes)
                                syncedAt: new Date()
                            }
                        });

                    processedCount++;

                    // Notificar progreso cada 10 cartas
                    if (processedCount % 10 === 0) {
                        sendEvent({
                            status: "progress",
                            message: `Sincronizando... ${processedCount}/${totalToSync}`,
                            count: processedCount,
                            total: totalToSync
                        });
                    }
                }

                // 5. Finalizar
                sendEvent({
                    status: "complete",
                    message: `¡Sincronización completada! ${processedCount} cartas actualizadas.`,
                    count: processedCount,
                    total: totalToSync
                });
                controller.close();

            } catch (error) {
                console.error("[CollectionSync] Error:", error);
                const msg = error instanceof Error ? error.message : "Error desconocido";
                sendEvent({ status: "error", message: msg });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
