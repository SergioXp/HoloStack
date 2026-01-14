
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards, sets } from "@/db/schema";
import { eq, sql, and, like, desc, isNotNull, or, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get("setId");
    const rarity = searchParams.get("rarity");
    const supertype = searchParams.get("supertype"); // Pokemon, Trainer, Energy
    const name = searchParams.get("name");

    try {
        let conditions = [];

        if (setId) {
            conditions.push(eq(cards.setId, setId));
        }

        // Handle multiple rarities (comma separated)
        const rarities = searchParams.get("rarities")?.split(",") || (rarity ? [rarity] : []);
        if (rarities.length > 0) {
            // Using OR for multiple rarities
            conditions.push(or(...rarities.map(r => like(cards.rarity, `%${r.trim()}%`))));
        }

        if (supertype) {
            conditions.push(eq(cards.supertype, supertype));
        }

        // Handle multiple names (comma separated)
        const names = searchParams.get("names")?.split(",") || (name ? [name] : []);
        if (names.length > 0) {
            conditions.push(or(...names.map(n => sql`lower(${cards.name}) LIKE ${`%${n.trim().toLowerCase()}%`}`)));
        }

        // Handle series (comma separated)
        const series = searchParams.get("series")?.split(",");
        if (series && series.length > 0) {
            conditions.push(inArray(sets.series, series));
        }

        if (conditions.length === 0) {
            return NextResponse.json([]);
        }

        const query = db.select({
            id: cards.id,
            name: cards.name,
            images: cards.images,
            rarity: cards.rarity,
            number: cards.number,
            setTotal: sets.printedTotal
        })
            .from(cards)
            .leftJoin(sets, eq(cards.setId, sets.id))
            .where(and(
                ...conditions,
                isNotNull(cards.images),
                sql`${cards.images} != '{}'`
            ))
            .limit(4)
            .orderBy(sql`RANDOM()`);

        const result = await query.all();

        return NextResponse.json(result);

    } catch (error) {
        console.error("Preview search error:", error);
        return NextResponse.json({ error: "Preview failed" }, { status: 500 });
    }
}
