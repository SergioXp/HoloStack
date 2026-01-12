import { db } from "@/db";
import { collections, collectionItems, cards, sets } from "@/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
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

        // Obtener items que el usuario TIENE en esta colección
        const items = await db.query.collectionItems.findMany({
            where: eq(collectionItems.collectionId, id),
        });

        // Construir ownership map
        const ownershipData: Record<string, any> = {};
        items.forEach(item => {
            if (!ownershipData[item.cardId]) ownershipData[item.cardId] = {};
            ownershipData[item.cardId][item.variant] = { quantity: item.quantity };
        });

        let resultCards: any[] = [];
        const filters = collection.filters ? JSON.parse(collection.filters) : {};

        if (filters.set) {
            // Si la colección está basada en un set, traemos TODAS las cartas del set para mostrar huecos
            resultCards = await db.select().from(cards)
                .where(eq(cards.setId, filters.set))
                // Intentar ordenar numéricamente si es posible, si no por string number
                // Como number es string ("001", "tg01"), orden alfabético relativo funciona aceptablemente
                // Idealmente necesitaríamos un campo numérico real o un cast.
                .orderBy(asc(cards.number));
        } else {
            // Si es manual, traemos solo las cartas que tiene
            const cardIds = items.map(i => i.cardId);
            if (cardIds.length > 0) {
                resultCards = await db.select().from(cards)
                    .where(inArray(cards.id, cardIds));
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

// PUT - Actualizar una colección
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        // Verificar que existe
        const existing = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });

        if (!existing) {
            return Response.json({ error: "Colección no encontrada" }, { status: 404 });
        }

        // Actualizar solo los campos proporcionados
        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.language !== undefined) updateData.language = body.language;
        if (body.showPrices !== undefined) updateData.showPrices = body.showPrices;
        if (body.sortBy !== undefined) updateData.sortBy = body.sortBy;

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

// DELETE - Eliminar una colección
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Verificar que existe
        const existing = await db.query.collections.findFirst({
            where: eq(collections.id, id),
        });

        if (!existing) {
            return Response.json({ error: "Colección no encontrada" }, { status: 404 });
        }

        // Eliminar items primero (aunque con cascade debería ser automático)
        await db.delete(collectionItems).where(eq(collectionItems.collectionId, id));

        // Eliminar colección
        await db.delete(collections).where(eq(collections.id, id));

        revalidatePath("/collections");

        return Response.json({ success: true, message: "Colección eliminada correctamente" });
    } catch (error) {
        console.error("Error deleting collection:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
