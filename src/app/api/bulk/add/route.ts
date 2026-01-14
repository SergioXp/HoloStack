
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems, collections } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { collectionId, cards } = body;

        if (!collectionId || !cards || !Array.isArray(cards) || cards.length === 0) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Verify collection exists
        const collection = await db.query.collections.findFirst({
            where: eq(collections.id, collectionId)
        });

        if (!collection) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        // Prepare items for insertion
        // cards is array of { card: { id: string }, quantity: number } from the client
        const itemsToInsert = cards.map((item: any) => ({
            collectionId: collectionId,
            cardId: item.card.id,
            quantity: item.quantity || 1,
            variant: item.variant || "normal",
            addedAt: new Date(),
        }));

        // Batch insert
        // SQLite has limits on params, but Drizzle handles it well usually. 
        // If really huge, might need chunking. Assuming reasonable booster box size (36 packs * 10 cards = 360) it should be fine.

        await db.insert(collectionItems).values(itemsToInsert);

        return NextResponse.json({ success: true, count: itemsToInsert.length });

    } catch (error) {
        console.error("Bulk Add Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
