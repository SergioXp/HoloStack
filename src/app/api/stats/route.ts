import { db } from "@/db";
import { collectionItems, cards, sets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateStats } from "@/lib/stats-logic";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Obtener todos los items con sus precios
        const allItems = await db
            .select({
                cardId: cards.id,
                cardNumber: cards.number,
                setId: cards.setId,
                setName: sets.name,
                variant: collectionItems.variant,
                quantity: collectionItems.quantity,
                cardName: cards.name,
                rarity: cards.rarity,
                setSeries: sets.series,
                tcgplayerPrices: cards.tcgplayerPrices,
                cardmarketPrices: cards.cardmarketPrices,
                images: cards.images,
            })
            .from(collectionItems)
            .leftJoin(cards, eq(collectionItems.cardId, cards.id))
            .leftJoin(sets, eq(cards.setId, sets.id));

        const stats = calculateStats(allItems as any);
        return Response.json(stats);

    } catch (error) {
        console.error("Error fetching stats:", error);
        return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
