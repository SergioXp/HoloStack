import { NextRequest, NextResponse } from "next/server";
import { performGlobalSearch } from "@/lib/global-search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const limitParam = searchParams.get("limit");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // Default limits
        const limits = { cards: 5, sets: 3, others: 3 };

        if (type === "card") {
            limits.cards = limitParam ? parseInt(limitParam) : 1000;
            limits.sets = 0;
            limits.others = 0;
        } else if (limitParam) {
            const l = parseInt(limitParam);
            limits.cards = l;
            limits.sets = l;
            limits.others = l;
        }

        const results = await performGlobalSearch(query, limits);
        return NextResponse.json(results);
    } catch (error) {
        console.error("Global search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
