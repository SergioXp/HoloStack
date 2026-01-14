import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems, cards, sets } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const collectionId = searchParams.get("collectionId");
        const thresholdStr = searchParams.get("threshold");

        if (!collectionId) {
            return NextResponse.json({ error: "Missing collectionId" }, { status: 400 });
        }

        const threshold = parseInt(thresholdStr || "4", 10);

        // Fetch items aggregated by card and variant with total quantity > threshold
        const duplicates = await db
            .select({
                itemId: sql<string>`MAX(${collectionItems.id})`, // Just take one ID for key
                cardId: collectionItems.cardId,
                variant: collectionItems.variant,
                quantity: sql<number>`SUM(${collectionItems.quantity})`,
                addedAt: sql<string>`MAX(${collectionItems.addedAt})`,
                card: {
                    name: cards.name,
                    number: cards.number,
                    rarity: cards.rarity,
                    images: cards.images,
                    tcgplayerPrices: cards.tcgplayerPrices,
                    cardmarketPrices: cards.cardmarketPrices,
                    setId: cards.setId,
                    setName: sets.name
                }
            })
            .from(collectionItems)
            .innerJoin(cards, eq(collectionItems.cardId, cards.id))
            .innerJoin(sets, eq(cards.setId, sets.id))
            .where(eq(collectionItems.collectionId, collectionId))
            .groupBy(collectionItems.cardId, collectionItems.variant)
            .having(sql`SUM(${collectionItems.quantity}) > ${threshold}`)
            .orderBy(desc(sql`SUM(${collectionItems.quantity})`));

        return NextResponse.json({
            duplicates: duplicates.map(d => ({
                ...d,
                excess: (d.quantity || 0) - threshold // Useful for knowing how many to sell
            }))
        });

    } catch (error) {
        console.error("Error fetching duplicates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
