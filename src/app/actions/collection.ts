"use server";

import { db } from "@/db";
import { collectionItems, collections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCollectionItem(
    collectionId: string,
    cardId: string,
    variant: string,
    quantity: number
) {
    try {
        // 1. Buscar si ya existe el item con esa variante
        const existingItem = await db.query.collectionItems.findFirst({
            where: and(
                eq(collectionItems.collectionId, collectionId),
                eq(collectionItems.cardId, cardId),
                eq(collectionItems.variant, variant)
            ),
        });

        if (quantity <= 0) {
            // Si la cantidad es 0 o menor, borramos el registro si existe
            if (existingItem) {
                await db.delete(collectionItems)
                    .where(eq(collectionItems.id, existingItem.id));
            }
        } else {
            // Si la cantidad es positiva
            if (existingItem) {
                // Actualizar
                await db.update(collectionItems)
                    .set({ quantity, addedAt: new Date() })
                    .where(eq(collectionItems.id, existingItem.id));
            } else {
                // Insertar
                await db.insert(collectionItems).values({
                    collectionId,
                    cardId,
                    variant,
                    quantity,
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
