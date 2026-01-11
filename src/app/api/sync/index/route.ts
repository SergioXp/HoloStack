import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cards, sets, pokemonSpecies } from "@/db/schema";
import { sql } from "drizzle-orm";

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                sendEvent({ message: "Conectando con PokeAPI...", progress: 5 });

                // 2. Fetch de TOKENS de nombres (PokeAPI)
                // Usamos 'pokemon-species' que es más limpio para nombres oficiales
                const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=2500");

                if (!response.ok) {
                    throw new Error(`PokeAPI Error: ${response.status}`);
                }

                const data = await response.json();
                const speciesList = data.results; // { name, url }
                const totalCount = speciesList.length;

                sendEvent({ message: `Descargados ${totalCount} nombres. Guardando...`, progress: 50 });

                // 3. Insertar en DB por lotes
                const BATCH_SIZE = 500;
                let processedCount = 0;

                for (let i = 0; i < totalCount; i += BATCH_SIZE) {
                    const batch = speciesList.slice(i, i + BATCH_SIZE);

                    const values = batch.map((s: any) => {
                        // Extract ID from URL: https://pokeapi.co/api/v2/pokemon-species/25/
                        const idMatch = s.url.match(/\/(\d+)\/$/);
                        const id = idMatch ? parseInt(idMatch[1]) : 0;
                        return {
                            id,
                            name: s.name,
                            updatedAt: new Date()
                        };
                    });

                    await db.insert(pokemonSpecies).values(values)
                        .onConflictDoUpdate({
                            target: pokemonSpecies.id,
                            set: { name: sql`excluded.name`, updatedAt: new Date() }
                        });

                    processedCount += batch.length;
                    const progress = 50 + Math.round((processedCount / totalCount) * 50);

                    sendEvent({
                        message: `Guardando Bloque ${Math.ceil(processedCount / BATCH_SIZE)}...`,
                        progress
                    });
                }

                sendEvent({ message: "Indexado completado exitosamente", progress: 100, done: true });

            } catch (error: any) {
                console.error("Indexing error:", error);
                sendEvent({ message: `Error: ${error.message}`, error: true });
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
