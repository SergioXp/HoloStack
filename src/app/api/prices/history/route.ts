import { db } from "@/db";
import { priceHistory, cards } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { parseCardmarketPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
        return NextResponse.json({ error: "Card ID required" }, { status: 400 });
    }

    try {
        // 1. Try to fetch real history from table
        const history = await db
            .select()
            .from(priceHistory)
            .where(eq(priceHistory.cardId, cardId))
            .orderBy(asc(priceHistory.date));

        if (history.length > 0) {
            return NextResponse.json(history);
        }

        // 2. Fallback: Construct history from Cardmarket aggregates (avg1, avg7, avg30)
        const cardData = await db
            .select({ cardmarketPrices: cards.cardmarketPrices })
            .from(cards)
            .where(eq(cards.id, cardId))
            .limit(1);

        if (cardData.length > 0 && cardData[0].cardmarketPrices) {
            const cmPrices = parseCardmarketPrices(cardData[0].cardmarketPrices);

            if (cmPrices) {
                const inferredHistory = [];
                const now = new Date();

                // 30 days ago
                if (cmPrices.avg30 && cmPrices.avg30 > 0) {
                    const date30 = new Date(now);
                    date30.setDate(date30.getDate() - 30);
                    inferredHistory.push({
                        date: date30.toISOString(),
                        marketPrice: cmPrices.avg30,
                        source: "cardmarket (avg30)"
                    });
                }

                // 7 days ago
                if (cmPrices.avg7 && cmPrices.avg7 > 0) {
                    const date7 = new Date(now);
                    date7.setDate(date7.getDate() - 7);
                    inferredHistory.push({
                        date: date7.toISOString(),
                        marketPrice: cmPrices.avg7,
                        source: "cardmarket (avg7)"
                    });
                }

                // Today (avg1 or trend)
                const todayPrice = cmPrices.avg1 || cmPrices.trendPrice || cmPrices.averageSellPrice;
                if (todayPrice && todayPrice > 0) {
                    inferredHistory.push({
                        date: now.toISOString(),
                        marketPrice: todayPrice,
                        source: "cardmarket (current)"
                    });
                }

                if (inferredHistory.length > 0) {
                    return NextResponse.json(inferredHistory);
                }
            }
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error("Error fetching price history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
