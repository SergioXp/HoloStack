import { db } from "@/db";
import { collections, collectionItems, sets } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import CollectionsIndexClient from "@/components/CollectionsIndexClient";

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

    const allSets = await db.select({
        id: sets.id,
        name: sets.name,
        total: sets.total,
        printedTotal: sets.printedTotal
    }).from(sets);

    return <CollectionsIndexClient collections={allCollections} sets={allSets} />;
}
