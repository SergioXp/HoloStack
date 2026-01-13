import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
            // Para colecciones manuales, borramos los items directamente
            await db.delete(collectionItems)
                .where(
                    inArray(collectionItems.cardId, cardIds)
                );
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
