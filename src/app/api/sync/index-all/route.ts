import { NextRequest } from "next/server";
import { db } from "@/db";
import { sets, cards, collectionItems, priceHistory } from "@/db/schema";
import { eq, lt, inArray, and, gte, sql } from "drizzle-orm";
import {
    fetchAllSets,
    fetchSetCardsDetailed,
    transformSetToSchema,
    transformCardToSchema
} from "@/services/tcgdex";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos máximo

/**
 * Indexado completo usando TCGdex API
 * GET /api/sync/index-all
 * 
 * Descarga todos los sets y cartas de TCGdex
 * Retorna SSE con progreso
 */
export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();
    const startTime = new Date();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // 1. Obtener todos los sets (con info de series)
                sendEvent({ status: "progress", message: "Obteniendo lista de sets y series...", progress: 5 });

                const allSets = await fetchAllSets(true);
                console.log(`[Index] Found ${allSets.length} sets`);

                sendEvent({
                    status: "progress",
                    message: `Encontrados ${allSets.length} sets`,
                    progress: 10,
                    total: allSets.length
                });

                if (allSets.length < 10) {
                    console.warn(`[Index] WARNING: Very few sets found (${allSets.length}). This might indicate a fetch issue.`);
                    allSets.forEach(s => console.log(` - Set: ${s.id} (${s.name}) cards: ${s.cardCount.total}`));
                }

                // 2. Guardar sets en BD
                for (const set of allSets) {
                    const setData = transformSetToSchema(set);
                    // Ensure we use the best format available (webp logic is in tcgdex service, but double checking here isn't bad if service changed)
                    await db.insert(sets).values(setData)
                        .onConflictDoUpdate({
                            target: sets.id,
                            set: {
                                syncedAt: new Date(),
                                series: setData.series,
                                name: setData.name,
                                total: setData.total,
                                printedTotal: setData.printedTotal,
                                // legalities removed
                                releaseDate: setData.releaseDate,
                                // Assuming transformSetToSchema now produces webp urls correctly based on previous edit to service
                                images: setData.images
                            }
                        });
                }

                sendEvent({
                    status: "progress",
                    message: `${allSets.length} sets guardados`,
                    progress: 20
                });

                // 3. Descargar cartas de cada set
                let processedSets = 0;
                let totalCards = 0;

                for (const set of allSets) {
                    try {
                        // Obtener cartas del set y metadata completa (incluida fecha de lanzamiento)
                        const { set: fullSetData, cards: setCards } = await fetchSetCardsDetailed(set.id);

                        // Actualizar metadatos del set con la información completa de la API individual
                        // Esto corrige la falta de fechas y otros detalles que no vienen en la lista sumario
                        if (fullSetData) {
                            const updatedSetData = transformSetToSchema(fullSetData);
                            // Preservar la serie que ya habíamos enriquecido
                            if (set.serie?.name) {
                                updatedSetData.series = set.serie.name;
                            }

                            await db.update(sets)
                                .set({
                                    releaseDate: updatedSetData.releaseDate,
                                    total: updatedSetData.total,
                                    printedTotal: updatedSetData.printedTotal,
                                    // legalities removed
                                    images: updatedSetData.images
                                })
                                .where(eq(sets.id, set.id));
                        }

                        // Guardar cartas en BD
                        for (const card of setCards) {
                            const cardData = transformCardToSchema(card);
                            await db.insert(cards).values(cardData)
                                .onConflictDoUpdate({
                                    target: cards.id,
                                    set: {
                                        isPartial: false,
                                        syncedAt: new Date(),
                                        tcgplayerPrices: cardData.tcgplayerPrices,
                                        cardmarketPrices: cardData.cardmarketPrices,
                                        // New gameplay fields
                                        attacks: cardData.attacks,
                                        abilities: cardData.abilities,
                                        weaknesses: cardData.weaknesses,
                                        retreatCost: cardData.retreatCost,
                                        hp: cardData.hp,
                                        types: cardData.types,
                                        supertype: cardData.supertype,
                                        subtypes: cardData.subtypes,
                                        evolvesFrom: cardData.evolvesFrom,
                                        images: cardData.images
                                    }
                                });
                        }

                        // Actualizar el total del set con las cartas reales encontradas (redundante pero seguro)
                        await db.update(sets)
                            .set({ total: setCards.length, printedTotal: setCards.length })
                            .where(eq(sets.id, set.id));

                        totalCards += setCards.length;
                        processedSets++;

                        const progress = 20 + Math.round((processedSets / allSets.length) * 75);

                        sendEvent({
                            status: "progress",
                            message: `${set.name}: ${setCards.length} cartas`,
                            progress,
                            processedSets,
                            totalSets: allSets.length,
                            totalCards
                        });

                    } catch (error) {
                        console.error(`[Index] Error processing set ${set.id}:`, error);
                        sendEvent({
                            status: "warning",
                            message: `Error en ${set.name}, continuando...`
                        });
                    }
                }

                // 4. Limpieza de sets obsoletos + Migración
                // Borrar sets que no se han actualizado en esta ejecución (IDs antiguos de otra API)
                const cleanupDate = startTime;
                let obsoleteSetsCount = 0;
                let migratedItemsCount = 0;

                try {
                    // Obtener sets obsoletos
                    const obsoleteSetsList = await db.select().from(sets).where(lt(sets.syncedAt, cleanupDate));

                    if (obsoleteSetsList.length > 0) {
                        console.log(`[Index] Found ${obsoleteSetsList.length} obsolete sets to clean up.`);

                        // Procesar por lotes para evitar límites de SQLite y memoria
                        const CHUNK_SIZE = 10;
                        for (let i = 0; i < obsoleteSetsList.length; i += CHUNK_SIZE) {
                            const setChunk = obsoleteSetsList.slice(i, i + CHUNK_SIZE);
                            const setIds = setChunk.map(s => s.id);

                            // 1. Obtener cartas obsoletas de estos sets
                            const obsoleteCards = await db.select({
                                id: cards.id,
                                name: cards.name,
                                number: cards.number,
                                setId: cards.setId
                            })
                                .from(cards)
                                .where(inArray(cards.setId, setIds));

                            const cardIds = obsoleteCards.map(c => c.id);

                            if (cardIds.length > 0) {
                                // 2. Migración de Colecciones (BEST EFFORT)
                                // Buscar items en colecciones que apunten a estas cartas
                                const itemsToMigrate = await db.select({
                                    id: collectionItems.id,
                                    cardId: collectionItems.cardId,
                                    collectionId: collectionItems.collectionId
                                })
                                    .from(collectionItems)
                                    .where(inArray(collectionItems.cardId, cardIds));

                                if (itemsToMigrate.length > 0) {
                                    console.log(`[Index] Attempting to migrate ${itemsToMigrate.length} collection items...`);

                                    // Para cada item, intentar buscar la carta NUEVA equivalente
                                    for (const item of itemsToMigrate) {
                                        const oldCard = obsoleteCards.find(c => c.id === item.cardId);
                                        const oldSet = setChunk.find(s => s.id === oldCard?.setId);

                                        if (oldCard && oldSet) {
                                            // Buscar carta nueva: Mismo nombre, Mismo número, En set con mismo nombre
                                            // Esto asume que el nombre del set es consistente entre APIs
                                            const newCardCandidates = await db.select({
                                                id: cards.id
                                            })
                                                .from(cards)
                                                .innerJoin(sets, eq(cards.setId, sets.id))
                                                .where(and(
                                                    eq(cards.name, oldCard.name),
                                                    eq(cards.number, oldCard.number),
                                                    eq(sets.name, oldSet.name),
                                                    gte(sets.syncedAt, cleanupDate) // Debe ser del nuevo sync
                                                ))
                                                .limit(1);

                                            if (newCardCandidates.length > 0) {
                                                const newCardId = newCardCandidates[0].id;
                                                // Actualizar referencia
                                                await db.update(collectionItems)
                                                    .set({ cardId: newCardId })
                                                    .where(eq(collectionItems.id, item.id));
                                                migratedItemsCount++;
                                            }
                                        }
                                    }
                                }

                                // 3. Borrar dependencias restantes (Items no migrados y PriceHistory)
                                // SQLite FK constraint saltará si no borramos esto antes de borrar cartas

                                // Borrar items de colección que sigan apuntando a cartas obsoletas (no se pudieron migrar)
                                await db.delete(collectionItems)
                                    .where(inArray(collectionItems.cardId, cardIds));

                                // Borrar historial de precios
                                await db.delete(priceHistory)
                                    .where(inArray(priceHistory.cardId, cardIds));

                                // 4. Borrar las cartas obsoletas
                                await db.delete(cards)
                                    .where(inArray(cards.id, cardIds));
                            }

                            // 5. Borrar los sets obsoletos
                            await db.delete(sets)
                                .where(inArray(sets.id, setIds));

                            obsoleteSetsCount += setChunk.length;
                        }

                        console.log(`[Index] Cleaned up ${obsoleteSetsCount} sets. Migrated ${migratedItemsCount} collection items.`);
                    }
                } catch (cleanupError) {
                    console.error(`[Index] Error during cleanup:`, cleanupError);
                    sendEvent({
                        status: "warning",
                        message: `Advertencia durante limpieza: ${(cleanupError as Error).message}`
                    });
                }

                // 5. Completado
                sendEvent({
                    status: "complete",
                    message: `¡Completado! ${processedSets} sets, ${totalCards} cartas. Eliminados ${obsoleteSetsCount} obsoletos, migrados ${migratedItemsCount} items.`,
                    progress: 100,
                    totalSets: processedSets,
                    totalCards
                });

                controller.close();

            } catch (error) {
                console.error("[Index] Error:", error);
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
