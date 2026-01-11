import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// GET - Obtener una colección específica
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

        return Response.json(collection);
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
