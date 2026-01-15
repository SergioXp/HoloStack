"use server";

import { db } from "@/db";
import { collectionItems, collections } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCollectionItem(
    collectionId: string,
    cardId: string,
    variant: string,
    quantity: number,
    notes?: string | null
) {
    try {
        // 1. Buscar TODOS los items con esa variante (para detectar duplicados)
        const existingItems = await db.query.collectionItems.findMany({
            where: and(
                eq(collectionItems.collectionId, collectionId),
                eq(collectionItems.cardId, cardId),
                eq(collectionItems.variant, variant)
            ),
        });

        if (quantity <= 0) {
            // Si la cantidad es 0 o menor, borramos todos los registros asociados
            if (existingItems.length > 0) {
                const idsToDelete = existingItems.map((i: any) => i.id);
                await db.delete(collectionItems)
                    .where(inArray(collectionItems.id, idsToDelete));
            }
        } else {
            // Si la cantidad es positiva
            if (existingItems.length > 0) {
                // Actualizar el PRIMERO con la nueva cantidad total y notas
                const firstItem = existingItems[0];
                const updateData: any = { quantity, addedAt: new Date() };
                if (notes !== undefined) updateData.notes = notes;

                await db.update(collectionItems)
                    .set(updateData)
                    .where(eq(collectionItems.id, firstItem.id));

                // Si hay duplicados (más de 1 registro), borrar los sobrantes
                if (existingItems.length > 1) {
                    const duplicateIds = existingItems.slice(1).map((i: any) => i.id);
                    await db.delete(collectionItems)
                        .where(inArray(collectionItems.id, duplicateIds));
                }
            } else {
                // Insertar nuevo si no existe
                await db.insert(collectionItems).values({
                    collectionId,
                    cardId,
                    variant,
                    quantity,
                    notes: notes || null
                });
            }
        }

        revalidatePath(`/collections/${collectionId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating collection item:", error);
        return { success: false, error: "Error al actualizar la colección" };
    }
}

export async function deleteCollection(collectionId: string) {
    try {
        await db.delete(collections).where(eq(collections.id, collectionId));
        revalidatePath("/collections"); // Ensure the list is updated
        return { success: true };
    } catch (error) {
        console.error("Error deleting collection:", error);
        return { success: false, error: "Error al eliminar la colección" };
    }
}
