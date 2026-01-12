import { NextRequest, NextResponse } from "next/server";
import { performGlobalSearch } from "@/lib/global-search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const results = await performGlobalSearch(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error("Global search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
