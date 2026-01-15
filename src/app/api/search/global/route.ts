
import { db } from "@/db";
import { cards, sets, collections, wishlistItems } from "@/db/schema";
import { like, or, and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    const searchQuery = `%${query}%`;

    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 8;

    interface SearchResult {
        type: "card" | "set" | "collection" | "wishlist" | "portfolio" | "budget";
        id: string;
        title: string;
        subtitle: string;
        image: string | null;
        url: string;
    }

    const results: SearchResult[] = [];

    // 1. Search Cards
    if (!type || type === "card") {
        const queryParts = query.trim().split(/\s+/).filter(part => part.length >= 2);

        let cardWhere;
        if (queryParts.length > 1) {
            // Multi-term search: each part must match something (name, set name, or set ID)
            const conditions = queryParts.map(part => {
                const partQuery = `%${part}%`;
                return or(
                    like(cards.name, partQuery),
                    like(sets.name, partQuery),
                    like(sets.id, partQuery)
                );
            });
            cardWhere = and(...conditions);
        } else {
            cardWhere = or(
                like(cards.name, searchQuery),
                like(cards.id, searchQuery),
                like(sets.name, searchQuery),
                like(sets.id, searchQuery)
            );
        }

        const cardResults = await db.select({
            id: cards.id,
            name: cards.name,
            set: sets.name,
            setId: sets.id,
            images: cards.images,
            rarity: cards.rarity,
            number: cards.number
        })
            .from(cards)
            .innerJoin(sets, eq(cards.setId, sets.id))
            .where(cardWhere)
            .limit(type === "card" ? limit : 8);

        cardResults.forEach(c => {
            const images = c.images ? JSON.parse(c.images) : null;
            results.push({
                type: "card",
                id: c.id,
                title: c.name,
                subtitle: `${c.set} (${c.setId?.toUpperCase()}) • #${c.number} • ${c.rarity || 'Common'}`,
                image: images?.small || null,
                url: `/cards/${c.id}`
            });
        });
    }

    // 2. Search Sets
    if (!type || type === "set") {
        const setResults = await db.select()
            .from(sets)
            .where(
                or(
                    like(sets.name, searchQuery),
                    like(sets.series, searchQuery),
                    like(sets.id, searchQuery)
                )
            )
            .limit(type === "set" ? limit : 3);

        setResults.forEach(s => {
            const images = s.images ? JSON.parse(s.images) : null;
            results.push({
                type: "set",
                id: s.id,
                title: s.name,
                subtitle: s.series,
                image: images?.logo || images?.symbol || null,
                url: `/explorer/${s.id}`
            });
        });
    }

    // 3. Search Collections
    if (!type || type === "collection") {
        const collectionResults = await db.select()
            .from(collections)
            .where(like(collections.name, searchQuery))
            .limit(type === "collection" ? limit : 3);

        collectionResults.forEach(c => {
            results.push({
                type: "collection",
                id: c.id,
                title: c.name,
                subtitle: c.type === 'auto' ? 'Automática' : 'Manual',
                image: null,
                url: `/collections/${c.id}`
            });
        });
    }

    return NextResponse.json(results);
}
