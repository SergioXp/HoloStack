
import { db } from "@/db";
import { cards, sets, collections, wishlistItems } from "@/db/schema";
import { like, or, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    const searchQuery = `%${query}%`;

    interface SearchResult {
        type: "card" | "set" | "collection" | "wishlist" | "portfolio" | "budget";
        id: string;
        title: string;
        subtitle: string;
        image: string | null;
        url: string;
    }

    const results: SearchResult[] = [];

    // 1. Search Cards (Top 5)
    // We try to match name primarily
    const cardResults = await db.select({
        id: cards.id,
        name: cards.name,
        set: sets.name,
        images: cards.images,
        rarity: cards.rarity
    })
        .from(cards)
        .innerJoin(sets, eq(cards.setId, sets.id))
        .where(
            or(
                like(cards.name, searchQuery),
                like(cards.id, searchQuery) // e.g. "base1-4"
            )
        )
        .limit(5);

    cardResults.forEach(c => {
        const images = c.images ? JSON.parse(c.images) : null;
        results.push({
            type: "card",
            id: c.id,
            title: c.name,
            subtitle: `${c.set} • ${c.rarity || 'Common'}`,
            image: images?.small || null,
            url: `/cards/${c.id}` // Assuming this route exists, or similar
        });
    });

    // 2. Search Sets (Top 3)
    const setResults = await db.select()
        .from(sets)
        .where(
            or(
                like(sets.name, searchQuery),
                like(sets.series, searchQuery)
            )
        )
        .limit(3);

    setResults.forEach(s => {
        const images = s.images ? JSON.parse(s.images) : null;
        results.push({
            type: "set",
            id: s.id,
            title: s.name,
            subtitle: s.series,
            image: images?.logo || images?.symbol || null,
            url: `/explorer/${s.id}` // Using set ID as per explorer structure
        });
    });

    // 3. Search Collections (Top 3)
    const collectionResults = await db.select()
        .from(collections)
        .where(like(collections.name, searchQuery))
        .limit(3);

    collectionResults.forEach(c => {
        results.push({
            type: "collection",
            id: c.id,
            title: c.name,
            subtitle: c.type === 'auto' ? 'Automática' : 'Manual',
            image: null, // Collections don't have images yet
            url: `/collections/${c.id}`
        });
    });

    return NextResponse.json(results);
}
