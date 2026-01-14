import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(
    request: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;

    try {
        const body = await request.json();
        const { cardId } = body;

        if (!cardId) {
            return Response.json({ error: "No card ID provided" }, { status: 400 });
        }

        const collection = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });

        if (!collection) {
            return Response.json({ error: "Collection not found" }, { status: 404 });
        }

        // For manual and generic_151 collections, we add the item to collectionItems
        if (collection.type === "manual" || collection.type === "generic_151") {
            // Check if already exists to increment quantity? 
            // Or typically we just insert. 
            // In manual collections, we often track specific copies with conditions, but here simplicity matches schema.
            // Let's check schema.
            // If primary key is composite (collectionId, cardId), we might need upsert.
            // But let's assume standard insert for now, checking schema next will confirm.

            // Checking schema via prior knowledge or tools:
            // collectionItems usually has id, collectionId, cardId, quantity etc.

            // We will attempt to insert or increment.
            const existing = await db.query.collectionItems.findFirst({
                where: (table, { and, eq }) => and(
                    eq(table.collectionId, id),
                    eq(table.cardId, cardId)
                )
            });

            if (existing) {
                await db.update(collectionItems)
                    .set({ quantity: (existing.quantity || 0) + 1 })
                    .where(eq(collectionItems.id, existing.id));
            } else {
                await db.insert(collectionItems).values({
                    collectionId: id,
                    cardId: cardId,
                    quantity: 1,
                    // other fields like addedAt?
                });
            }
        } else {
            return Response.json({ error: "Cannot manually add items to automatic collections" }, { status: 400 });
        }

        revalidatePath(`/collections/${id}`);

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error adding item:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { cardIds } = body;

        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return Response.json({ error: "No card IDs provided" }, { status: 400 });
        }

        const collection = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });

        if (!collection) {
            return Response.json({ error: "Collection not found" }, { status: 404 });
        }

        if (collection.type === "auto") {
            // Para colecciones automáticas, añadimos a la lista de exclusión
            const filters = collection.filters ? JSON.parse(collection.filters) : {};
            const excluded = new Set(filters.excludedCardIds || []);

            cardIds.forEach((cid: string) => excluded.add(cid));

            filters.excludedCardIds = Array.from(excluded);

            await db.update(collections)
                .set({ filters: JSON.stringify(filters) })
                .where(eq(collections.id, id));

        } else {
            // Para colecciones manuales, decrementar cantidad o eliminar si es 1
            // Iteramos porque inArray borraría todas las copias de golpe, y queremos borrar de 1 en 1
            // Si el frontend envía IDs repetidos, procesamos cada uno

            for (const cardId of cardIds) {
                const item = await db.query.collectionItems.findFirst({
                    where: (table, { and, eq }) => and(
                        eq(table.collectionId, id),
                        eq(table.cardId, cardId)
                    )
                });

                if (item) {
                    if ((item.quantity || 1) > 1) {
                        await db.update(collectionItems)
                            .set({ quantity: (item.quantity || 1) - 1 })
                            .where(eq(collectionItems.id, item.id));
                    } else {
                        await db.delete(collectionItems).where(eq(collectionItems.id, item.id));
                    }
                }
            }
        }

        // Revalidar caché
        revalidatePath(`/collections/${id}`);
        revalidatePath("/collections");

        return Response.json({ success: true, count: cardIds.length });

    } catch (error) {
        console.error("Error deleting items:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
