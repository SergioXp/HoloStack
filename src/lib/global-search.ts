import { db } from "@/db";
import { cards, sets, collections, budgets, wishlistItems, collectionItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type SearchResultType = "card" | "set" | "collection" | "wishlist" | "portfolio" | "budget";

export interface GlobalSearchResult {
    type: SearchResultType;
    id: string;
    title: string;
    subtitle: string;
    image: string | null;
    url: string;
    details?: any; // Para extra info si es necesario
}

export async function performGlobalSearch(query: string, limits = { cards: 5, sets: 3, others: 3 }): Promise<GlobalSearchResult[]> {
    if (!query || query.length < 2) return [];

    const searchPattern = `%${query.toLowerCase()}%`;

    // 1. Buscar Sets
    const setResults = await db.select({
        id: sets.id,
        name: sets.name,
        series: sets.series,
        images: sets.images,
    })
        .from(sets)
        .where(sql`lower(${sets.name}) LIKE ${searchPattern}`)
        .limit(limits.sets);

    // 2. Buscar Cartas
    const cardResults = await db.select({
        id: cards.id,
        name: cards.name,
        number: cards.number,
        images: cards.images,
        setId: cards.setId,
        setName: sets.name,
    })
        .from(cards)
        .leftJoin(sets, eq(cards.setId, sets.id))
        .where(sql`lower(${cards.name}) LIKE ${searchPattern}`)
        .limit(limits.cards);

    // 3. Buscar en Colecciones
    const collectionResults = await db.select({
        id: collections.id,
        name: collections.name,
        type: collections.type,
    })
        .from(collections)
        .where(sql`lower(${collections.name}) LIKE ${searchPattern}`)
        .limit(limits.others);

    // 4. Buscar en Wishlist
    const wishlistResults = await db.select({
        id: wishlistItems.id,
        cardId: wishlistItems.cardId,
        cardName: cards.name,
        cardNumber: cards.number,
        setId: cards.setId,
        setName: sets.name,
        images: cards.images,
    })
        .from(wishlistItems)
        .leftJoin(cards, eq(wishlistItems.cardId, cards.id))
        .leftJoin(sets, eq(cards.setId, sets.id))
        .where(sql`lower(${cards.name}) LIKE ${searchPattern}`)
        .limit(limits.others);

    // 5. Buscar en Portfolio
    const portfolioResults = await db.select({
        cardId: collectionItems.cardId,
        cardName: cards.name,
        cardNumber: cards.number,
        setId: cards.setId,
        setName: sets.name,
        images: cards.images,
        totalQuantity: sql<number>`sum(${collectionItems.quantity})`,
    })
        .from(collectionItems)
        .leftJoin(cards, eq(collectionItems.cardId, cards.id))
        .leftJoin(sets, eq(cards.setId, sets.id))
        .where(sql`lower(${cards.name}) LIKE ${searchPattern}`)
        .groupBy(collectionItems.cardId)
        .limit(limits.others);

    // 6. Buscar en Presupuestos
    const budgetResults = await db.select({
        id: budgets.id,
        name: budgets.name,
        amount: budgets.amount,
        currency: budgets.currency,
    })
        .from(budgets)
        .where(sql`lower(${budgets.name}) LIKE ${searchPattern}`)
        .limit(limits.others);

    return [
        ...setResults.map(s => ({
            type: "set" as const,
            id: s.id,
            title: s.name,
            subtitle: s.series,
            image: s.images ? JSON.parse(s.images).symbol : null,
            url: `/explorer/set/${s.id}`
        })),
        ...cardResults.map(c => ({
            type: "card" as const,
            id: c.id,
            title: c.name,
            subtitle: `${c.setName} #${c.number}`,
            image: c.images ? JSON.parse(c.images).small : null,
            url: `/cards/${c.id}`
        })),
        ...collectionResults.map(c => ({
            type: "collection" as const,
            id: c.id,
            title: c.name,
            subtitle: c.type === 'manual' ? "Collection" : "Binder",
            image: null,
            url: `/collections/${c.id}`
        })),
        ...wishlistResults.map(w => ({
            type: "wishlist" as const,
            id: String(w.id),
            title: w.cardName || "Unknown Card",
            subtitle: "En Wishlist",
            image: w.images ? JSON.parse(w.images).small : null,
            url: `/wishlist`
        })),
        ...portfolioResults.map(p => ({
            type: "portfolio" as const,
            id: p.cardId,
            title: p.cardName || "Unknown Card",
            subtitle: `En Posesión (x${p.totalQuantity})`,
            image: p.images ? JSON.parse(p.images).small : null,
            url: `/cards/${p.cardId}`
        })),
        ...budgetResults.map(b => ({
            type: "budget" as const,
            id: b.id,
            title: b.name,
            subtitle: `Budget: ${b.amount} ${b.currency}`,
            image: null,
            url: `/budgets/${b.id}`
        }))
    ];
}
