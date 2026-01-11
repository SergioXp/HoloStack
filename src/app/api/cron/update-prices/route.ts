import { db } from "@/db";
import { collectionItems, cards, priceHistory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { fetchCard } from "@/services/tcgdex";

// Esta ruta puede ser llamada por un cron job (ej: Vercel Cron, GitHub Actions)
// Proteger con un secret para evitar abusos

export async function GET(request: NextRequest) {
    // Verificar API key para seguridad
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.CRON_SECRET;

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    try {
        // 1. Obtener cartas únicas que los usuarios tienen en sus colecciones
        const ownedCards = await db
            .selectDistinct({ cardId: collectionItems.cardId })
            .from(collectionItems);

        if (ownedCards.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No hay cartas en colecciones para actualizar",
                updated: 0
            });
        }

        console.log(`[Price Update] Found ${ownedCards.length} unique cards to update`);

        let updatedCount = 0;
        let errorCount = 0;

        // 2. Procesar cada carta usando TCGdex (es rápido, no necesita batching)
        for (const { cardId } of ownedCards) {
            try {
                const card = await fetchCard(cardId);

                if (!card.pricing) {
                    continue;
                }

                // Obtener precio de TCGPlayer primero
                let marketPrice: number | null = null;
                let source = "tcgplayer";

                if (card.pricing.tcgplayer) {
                    const tcgPrices = card.pricing.tcgplayer;
                    if (tcgPrices.holofoil?.marketPrice) {
                        marketPrice = tcgPrices.holofoil.marketPrice;
                    } else if (tcgPrices.normal?.marketPrice) {
                        marketPrice = tcgPrices.normal.marketPrice;
                    }
                }

                // Si no hay precio en TCGPlayer, intentar Cardmarket
                if (marketPrice === null && card.pricing.cardmarket?.avg) {
                    marketPrice = card.pricing.cardmarket.avg;
                    source = "cardmarket";
                }

                if (marketPrice !== null) {
                    // Verificar si ya existe un registro para hoy
                    const existing = await db.select()
                        .from(priceHistory)
                        .where(sql`${priceHistory.cardId} = ${cardId} AND ${priceHistory.date} = ${today}`)
                        .limit(1);

                    if (existing.length === 0) {
                        await db.insert(priceHistory).values({
                            cardId: cardId,
                            date: today,
                            marketPrice: marketPrice,
                            source: source
                        });
                        updatedCount++;
                    }

                    // También actualizar los precios en la tabla de cartas
                    await db.update(cards)
                        .set({
                            tcgplayerPrices: JSON.stringify(card.pricing.tcgplayer || {}),
                            cardmarketPrices: JSON.stringify(card.pricing.cardmarket || {}),
                        })
                        .where(eq(cards.id, cardId));
                }

            } catch (error) {
                console.error(`[Price Update] Error for card ${cardId}:`, error);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Precios actualizados para ${updatedCount} cartas`,
            updated: updatedCount,
            errors: errorCount,
            total: ownedCards.length
        });

    } catch (error) {
        console.error("[Price Update] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
