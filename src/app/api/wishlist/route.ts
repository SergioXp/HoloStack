import { db } from "@/db";
import { wishlistItems, cards, sets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");

    try {
        let query = db
            .select({
                id: wishlistItems.id,
                cardId: wishlistItems.cardId,
                addedAt: wishlistItems.addedAt,
                priority: wishlistItems.priority,
                notes: wishlistItems.notes,
                card: cards,
                set: sets
            })
            .from(wishlistItems)
            .leftJoin(cards, eq(wishlistItems.cardId, cards.id))
            .leftJoin(sets, eq(cards.setId, sets.id))
            .orderBy(desc(wishlistItems.addedAt))
            .$dynamic();

        if (cardId) {
            query = query.where(eq(wishlistItems.cardId, cardId));
        }

        const items = await query;
        return Response.json(items);
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        return Response.json({ error: "Failed to fetch wishlist" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cardId, priority, notes } = body;

        if (!cardId) {
            return Response.json({ error: "Card ID is required" }, { status: 400 });
        }

        // Check duplicates
        const existing = await db
            .select()
            .from(wishlistItems)
            .where(eq(wishlistItems.cardId, cardId))
            .limit(1);

        if (existing.length > 0) {
            return Response.json({ message: "Item already in wishlist" }, { status: 409 });
        }

        const res = await db.insert(wishlistItems).values({
            cardId,
            priority: priority || "normal",
            notes: notes || ""
        }).returning();

        return Response.json(res[0]);
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return Response.json({ error: "Failed to add to wishlist" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const cardId = searchParams.get("cardId");

    if (!id && !cardId) return Response.json({ error: "ID or CardID required" }, { status: 400 });

    try {
        if (id) {
            await db.delete(wishlistItems).where(eq(wishlistItems.id, parseInt(id)));
        } else if (cardId) {
            await db.delete(wishlistItems).where(eq(wishlistItems.cardId, cardId));
        }
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: "Failed to delete" }, { status: 500 });
    }
}
