import { db } from "@/db";
import { cards, sets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ setId: string }> }
) {
    const { setId } = await params;

    try {
        const setCards = await db.select().from(cards).where(eq(cards.setId, setId));
        return Response.json({
            count: setCards.length,
            cards: setCards
        });
    } catch (error) {
        return Response.json({ error: "Error al leer cartas" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ setId: string }> }
) {
    const { setId } = await params;
    const encoder = new TextEncoder();

    console.log(`[Sync Cards] Iniciando descarga de cartas para set: ${setId}`);

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            try {
                sendEvent({ status: "starting", message: "Conectando con TCGdex..." });

                // 1. Verificar set en BD (opcional, pero útil para nombre)
                const existingSet = await db.select().from(sets).where(eq(sets.id, setId)).get();
                const setName = existingSet?.name || setId;

                // 2. Descargar cartas de TCGdex
                sendEvent({ status: "progress", message: `Descargando cartas de ${setName}...`, count: 0 });

                // Importar dinámicamente o usar las funciones importadas arriba
                const { fetchSetCardsDetailed, transformCardToSchema } = await import("@/services/tcgdex");

                const result = await fetchSetCardsDetailed(setId);
                const setCards = result.cards;

                sendEvent({ status: "progress", message: `Guardando ${setCards.length} cartas...`, count: setCards.length });

                // 3. Guardar en BD
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
                            }
                        });
                }

                // 4. Actualizar total del set
                // IMPORTANTE: Incluso si es 0, para corregir sets futuros
                await db.update(sets)
                    .set({ total: setCards.length, printedTotal: setCards.length, syncedAt: new Date() })
                    .where(eq(sets.id, setId));

                console.log(`[Sync Cards] Completado: ${setCards.length} cartas`);

                sendEvent({
                    status: "complete",
                    message: `Completado: ${setCards.length} cartas`,
                    count: setCards.length
                });

                controller.close();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                console.error(`[Sync Cards] Error: ${errorMessage}`);
                sendEvent({ status: "error", message: errorMessage });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
