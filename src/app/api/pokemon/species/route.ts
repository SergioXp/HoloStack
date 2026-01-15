import { db } from "@/db";
import { pokemonSpecies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { cleanNameForSpecies } from "@/lib/pokemon-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
        return Response.json({ error: "Falta el nombre" }, { status: 400 });
    }

    try {
        const cleanedName = cleanNameForSpecies(name);

        const results = await db.select()
            .from(pokemonSpecies)
            .where(sql`lower(${pokemonSpecies.name}) = ${cleanedName} OR lower(replace(${pokemonSpecies.name}, '-', '')) = ${cleanedName.replace(/-/g, '')}`)
            .all();

        let species = results[0];

        if (!species) {
            const partial = await db.select()
                .from(pokemonSpecies)
                .where(sql`lower(${pokemonSpecies.name}) LIKE ${`%${cleanedName}%`} OR ${cleanedName} LIKE '%' || lower(${pokemonSpecies.name}) || '%'`)
                .orderBy(sql`length(${pokemonSpecies.name}) ASC`)
                .limit(1)
                .all();
            species = partial[0];
        }

        if (!species) {
            return Response.json({ error: "No encontrado", cleaned: cleanedName }, { status: 404 });
        }

        return Response.json({
            id: species.id,
            name: species.name,
            artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${species.id}.png`
        });
    } catch (error) {
        console.error("Species API Error:", error);
        return Response.json({ error: "Error interno" }, { status: 500 });
    }
}
