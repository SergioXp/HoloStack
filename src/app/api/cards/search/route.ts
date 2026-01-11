
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards, sets } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const searchPattern = `%${query.toLowerCase()}%`;

        const results = await db.select({
            id: cards.id,
            name: cards.name,
            number: cards.number,
            rarity: cards.rarity,
            images: cards.images,
            setId: cards.setId,
            setName: sets.name,
            setSeries: sets.series
        })
            .from(cards)
            .leftJoin(sets, eq(cards.setId, sets.id))
            .where(sql`lower(${cards.name}) LIKE ${searchPattern}`)
            .limit(30)
            .all();

        return NextResponse.json(results);
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
