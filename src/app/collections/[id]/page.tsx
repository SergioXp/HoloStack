import { notFound } from "next/navigation";
import { db } from "@/db";
import { collections, collectionItems, cards, sets } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import CollectionDetailClient from "@/components/CollectionDetailClient";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const collection = await db.query.collections.findFirst({
        where: eq(collections.id, id),
    });

    if (!collection) {
        notFound();
    }

    const ownedItems = await db.select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, id));

    const ownershipMap = new Map<string, Map<string, number>>();

    ownedItems.forEach(item => {
        if (!ownershipMap.has(item.cardId)) {
            ownershipMap.set(item.cardId, new Map());
        }
        const variantsMap = ownershipMap.get(item.cardId)!;
        const currentQty = variantsMap.get(item.variant) || 0;
        variantsMap.set(item.variant, currentQty + (item.quantity || 0));
    });

    let displayCards: any[] = [];
    let totalCardsCount = 0;

    if (collection.type === "auto" && collection.filters) {
        const filters = JSON.parse(collection.filters);

        const query = db.select().from(cards);
        const conditions = [];

        if (filters.set) {
            conditions.push(eq(cards.setId, filters.set));
        }

        if (filters.rarity) {
            conditions.push(eq(cards.rarity, filters.rarity));
        }

        if (filters.name) {
            conditions.push(sql`lower(${cards.name}) = ${filters.name.toLowerCase()}`);
        }

        if (filters.supertype) {
            conditions.push(eq(cards.supertype, filters.supertype));
        }

        if (conditions.length > 0) {
            // @ts-ignore
            displayCards = await query.where(and(...conditions));
        } else {
            displayCards = [];
        }

        displayCards.sort((a, b) => {
            if (a.setId !== b.setId) return a.setId.localeCompare(b.setId);
            const numA = parseInt(a.number) || 0;
            const numB = parseInt(b.number) || 0;
            return numA - numB;
        });

        totalCardsCount = displayCards.length;

    } else {
        const items = await db.query.collectionItems.findMany({
            where: eq(collectionItems.collectionId, collection.id),
            with: {
                card: true
            }
        });
        displayCards = items.map(i => i.card);
        totalCardsCount = items.length;
    }

    const uniqueOwnedCount = displayCards.filter(c => ownershipMap.has(c.id)).length;
    const progress = totalCardsCount > 0 ? Math.round((uniqueOwnedCount / totalCardsCount) * 100) : 0;
    const isComplete = progress === 100;

    const uniqueSets = new Set(displayCards.map(c => c.setId));
    const isMultiSet = uniqueSets.size > 1;

    // Siempre cargar nombres de sets para la vista de tabla
    const setNameMap = new Map<string, string>();
    if (uniqueSets.size > 0) {
        const setIds = Array.from(uniqueSets);
        const setRecords = await db.select({ id: sets.id, name: sets.name })
            .from(sets)
            .where(sql`${sets.id} IN (${sql.join(setIds.map(id => sql`${id}`), sql`, `)})`);
        setRecords.forEach(s => setNameMap.set(s.id, s.name));
    }

    // Serializar para Client Component
    const serializedCollection = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        type: collection.type,
        language: collection.language,
        showPrices: collection.showPrices ?? false,
        sortBy: collection.sortBy,
        filters: collection.filters,
    };

    const serializedCards = displayCards.map(c => ({
        ...c,
        syncedAt: c.syncedAt ? c.syncedAt.toISOString() : null,
        // Drizzle devuelve objetos planos para el resto, pero Date fields deben ser string.
    }));

    return (
        <CollectionDetailClient
            collection={serializedCollection}
            displayCards={serializedCards}
            ownershipData={Object.fromEntries(
                Array.from(ownershipMap.entries()).map(([cardId, variantMap]) => [
                    cardId,
                    Object.fromEntries(variantMap.entries())
                ])
            )}
            totalCardsCount={totalCardsCount}
            uniqueOwnedCount={uniqueOwnedCount}
            progress={progress}
            isComplete={isComplete}
            isMultiSet={isMultiSet}
            setNames={Object.fromEntries(setNameMap.entries())}
        />
    );
}
