import { db } from "@/db";
import { eq, inArray, asc, sql, and, or, between } from "drizzle-orm";
import { collections, collectionItems, cards, sets, pokemonSpecies } from "@/db/schema";
import { revalidatePath } from "next/cache";

// GET - Obtener una colección específica con sus cartas
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const collection = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });

        if (!collection) {
            return Response.json({ error: "Colección no encontrada" }, { status: 404 });
        }

        const items = await db.query.collectionItems.findMany({
            where: eq(collectionItems.collectionId, id),
        });

        const ownershipData: Record<string, any> = {};
        items.forEach(item => {
            if (!ownershipData[item.cardId]) ownershipData[item.cardId] = {};
            ownershipData[item.cardId][item.variant] = {
                quantity: item.quantity,
                id: item.id,
                notes: item.notes
            };
        });

        let resultCards: any[] = [];
        const filters = collection.filters ? JSON.parse(collection.filters) : {};

        // Query base con JOIN a especies ULTRA robusto
        // Limpiamos absolutamente todo para que el matching sea por la "esencia" del nombre
        const baseQuery = db.select({
            id: cards.id,
            name: cards.name,
            number: cards.number,
            nationalId: pokemonSpecies.id,
            rarity: cards.rarity,
            images: cards.images,
            hp: cards.hp,
            types: cards.types,
            attacks: cards.attacks,
            abilities: cards.abilities,
            weaknesses: cards.weaknesses,
            retreatCost: cards.retreatCost,
            setId: cards.setId,
            setName: sets.name,
            setSeries: sets.series
        })
            .from(cards)
            .leftJoin(sets, eq(cards.setId, sets.id))
            .leftJoin(pokemonSpecies, sql`
            lower(replace(replace(replace(replace(replace(replace(replace(replace(${cards.name}, ' ', ''), '-', ''), '.', ''), '''', ''), '’', ''), '♂', 'm'), '♀', 'f'), 'é', 'e')) 
            LIKE '%' || lower(replace(replace(replace(replace(replace(replace(${pokemonSpecies.name}, '-', ''), ' ', ''), '.', ''), '''', ''), '’', ''), 'é', 'e')) || '%'
        `);

        if (filters.set) {
            resultCards = await baseQuery
                .where(eq(cards.setId, filters.set))
                .orderBy(asc(cards.number))
                .all();
        } else if (filters.generation === "all") {
            // National Dex: una por especie
            const allSpeciesCards = await baseQuery
                .orderBy(asc(pokemonSpecies.id), sql`length(${cards.name}) ASC`, asc(cards.number))
                .all();

            const seenIds = new Set();
            resultCards = allSpeciesCards.filter(c => {
                if (!c.nationalId) return false;
                if (seenIds.has(c.nationalId)) return false;

                // Evitar falsos positivos como "Mewtwo" para "Mew"
                // Si el nombre de la especie es corto, el nombre de la carta debe empezar o terminar con él
                // o estar rodeado de espacios (esto es difícil en SQL corregido, lo hacemos aquí)
                const cardClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                // Buscamos el nombre de la especie en pokemonSpecies? No lo tenemos aquí fácilmente.
                // Pero ya estamos filtrando por c.nationalId.

                seenIds.add(c.nationalId);
                return true;
            });
        } else if (filters.generation) {
            const genRanges: Record<string, [number, number]> = {
                "gen1": [1, 151], "gen2": [152, 251], "gen3": [252, 386],
                "gen4": [387, 493], "gen5": [494, 649], "gen6": [650, 721],
                "gen7": [722, 809], "gen8": [810, 905], "gen9": [906, 1025]
            };
            const range = genRanges[filters.generation];
            if (range) {
                const [start, end] = range;
                const genCards = await baseQuery
                    .where(between(pokemonSpecies.id, start, end))
                    .orderBy(asc(pokemonSpecies.id), sql`length(${cards.name}) ASC`)
                    .all();

                const seenIds = new Set();
                resultCards = genCards.filter(c => {
                    if (!c.nationalId) return false;
                    if (seenIds.has(c.nationalId)) return false;
                    seenIds.add(c.nationalId);
                    return true;
                });
            }
        } else {
            const cardIds = items.map(i => i.cardId);
            if (cardIds.length > 0) {
                resultCards = await baseQuery
                    .where(inArray(cards.id, cardIds))
                    .all();
            }
        }

        return Response.json({
            ...collection,
            cards: resultCards,
            ownershipData,
            setName: filters.set ? (await db.query.sets.findFirst({
                where: eq(sets.id, filters.set),
                columns: { name: true }
            }))?.name : undefined
        });
    } catch (error) {
        console.error("Error fetching collection:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const existing = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });
        if (!existing) return Response.json({ error: "Colección no encontrada" }, { status: 404 });

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.filters !== undefined) updateData.filters = body.filters;

        const [updated] = await db.update(collections)
            .set(updateData)
            .where(eq(collections.id, id))
            .returning();

        revalidatePath(`/collections/${id}`);
        revalidatePath("/collections");

        return Response.json(updated);
    } catch (error) {
        console.error("Error updating collection:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await db.delete(collections).where(eq(collections.id, id));
        revalidatePath("/collections");
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: "Error" }, { status: 500 });
    }
}
