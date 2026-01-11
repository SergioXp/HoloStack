import { db } from "@/db";
import { pokemonSpecies } from "@/db/schema";
import { like } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // Query the global Pokemon Species table (PokeAPI source)
        const results = await db
            .select({ name: pokemonSpecies.name })
            .from(pokemonSpecies)
            .where(like(pokemonSpecies.name, `%${query}%`))
            .limit(10);

        return NextResponse.json(results.map(r => r.name));
    } catch (e) {
        console.error("Autocomplete error:", e);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
