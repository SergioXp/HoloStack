import { db } from "@/db";
import { collections, collectionItems, sets, cards } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import CollectionsIndexClient from "@/components/CollectionsIndexClient";
import { calculateTotalValue, Variant } from "@/lib/prices";

export const dynamic = "force-dynamic";

export default async function CollectionsIndexPage() {
    const allCollections = await db.select({
        id: collections.id,
        name: collections.name,
        type: collections.type,
        filters: collections.filters,
        createdAt: collections.createdAt,
        uniqueCardCount: sql<number>`count(distinct ${collectionItems.cardId})`
    })
        .from(collections)
        .leftJoin(collectionItems, eq(collections.id, collectionItems.collectionId))
        .groupBy(collections.id)
        .orderBy(desc(collections.createdAt));

    // Calculate value for each collection
    // This is N+1 but optimized by fetching all items for all collections in one go if possible, 
    // or just iterating since the number of collections is small.
    // For better perf with many collections: Fetch all collectionItems + prices in one big query and group by collectionId in JS.

    const allItems = await db.select({
        collectionId: collectionItems.collectionId,
        quantity: collectionItems.quantity,
        tcgplayerPrices: cards.tcgplayerPrices,
        cardmarketPrices: cards.cardmarketPrices,
        variant: collectionItems.variant
    })
        .from(collectionItems)
        .innerJoin(cards, eq(collectionItems.cardId, cards.id));

    // Group by collection
    const valueMap = new Map<string, number>();

    // Group items by collection first
    const itemsByCollection = new Map<string, typeof allItems>();

    allItems.forEach(item => {
        if (!itemsByCollection.has(item.collectionId)) {
            itemsByCollection.set(item.collectionId, []);
        }
        itemsByCollection.get(item.collectionId)?.push(item);
    });

    // Calculate value for each collection using shared helper
    itemsByCollection.forEach((items, collectionId) => {
        const value = calculateTotalValue(
            items.map(i => ({
                ...i,
                quantity: i.quantity || 1,
                variant: (i.variant || 'normal') as Variant
            })),
            'EUR'
        );
        valueMap.set(collectionId, value);
    });

    const collectionsWithStats = allCollections.map(c => ({
        ...c,
        totalValue: valueMap.get(c.id) || 0
    }));

    const allSets = await db.select({
        id: sets.id,
        name: sets.name,
        total: sets.total,
        printedTotal: sets.printedTotal
    }).from(sets);

    return <CollectionsIndexClient collections={collectionsWithStats} sets={allSets} />;
}
