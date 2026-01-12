import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { fetchCard } from "@/services/tcgdex";

export const dynamic = "force-dynamic";

// Tiempo máximo antes de refrescar (24 horas en ms)
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface RefreshResult {
    cardId: string;
    refreshed: boolean;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cardIds } = body as { cardIds: string[] };

        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return NextResponse.json({ error: "cardIds required" }, { status: 400 });
        }

        // Limitar a 50 cartas por request para evitar abuso
        const limitedCardIds = cardIds.slice(0, 50);

        // ... obtención de datos preliminares ...
        const cardsData = await db
            .select({
                id: cards.id,
                name: cards.name,
                cardmarketPrices: cards.cardmarketPrices,
                tcgplayerPrices: cards.tcgplayerPrices,
                syncedAt: cards.syncedAt,
            })
            .from(cards)
            .where(inArray(cards.id, limitedCardIds));

        const now = Date.now();
        const results: RefreshResult[] = [];
        const toRefresh: typeof cardsData = [];

        // Verificar cuáles necesitan actualización
        for (const card of cardsData) {
            let needsRefresh = false;

            if (!card.syncedAt) {
                needsRefresh = true;
            } else {
                const refreshedMs = card.syncedAt.getTime();
                if (now - refreshedMs > MAX_AGE_MS) {
                    needsRefresh = true;
                }
            }

            if (needsRefresh) {
                toRefresh.push(card);
            } else {
                results.push({ cardId: card.id, refreshed: false });
            }
        }

        // Actualizar las cartas que lo necesitan (en paralelo pero con límite)
        const refreshPromises = toRefresh.map(async (card) => {
            try {
                const freshData = await fetchCard(card.id);

                if (freshData.pricing) {
                    await db.update(cards)
                        .set({
                            tcgplayerPrices: JSON.stringify(freshData.pricing.tcgplayer || {}),
                            cardmarketPrices: JSON.stringify(freshData.pricing.cardmarket || {}),
                            syncedAt: new Date(),
                        })
                        .where(eq(cards.id, card.id));

                    return { cardId: card.id, refreshed: true };
                }

                // SI NO HAY PRECIOS O FALLA, marcamos como sincronizado para evitar bucle infinito
                await db.update(cards)
                    .set({ syncedAt: new Date() })
                    .where(eq(cards.id, card.id));

                return { cardId: card.id, refreshed: false, error: "No pricing data" };
            } catch (error) {
                console.error(`Error refreshing ${card.id}:`, error);

                // Tambien marcamos sincronizado en error (para no reintentar inmediatamente)
                await db.update(cards)
                    .set({ syncedAt: new Date() })
                    .where(eq(cards.id, card.id));

                return { cardId: card.id, refreshed: false, error: "Fetch failed" };
            }
        });

        const refreshResults = await Promise.all(refreshPromises);
        results.push(...refreshResults);

        return NextResponse.json({
            success: true,
            total: limitedCardIds.length,
            refreshed: results.filter(r => r.refreshed).length,
            results,
        });

    } catch (error) {
        console.error("Error in prices/refresh:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
