
import { db } from "@/db";
import { collectionItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface CollectionItemParams {
    collectionId: string;
    cardId: string;
    variant?: string;
    quantity: number;
}

/**
 * Business logic for upserting/deleting collection items.
 * Decoupled from NextRequest/Response for easier testing.
 */
export async function manageCollectionItem(database: typeof db, params: CollectionItemParams) {
    const { collectionId, cardId, quantity } = params;
    const variantValue = params.variant || "normal";

    const existing = await database.query.collectionItems.findFirst({
        where: and(
            eq(collectionItems.collectionId, collectionId),
            eq(collectionItems.cardId, cardId),
            eq(collectionItems.variant, variantValue)
        )
    });

    if (quantity <= 0) {
        if (existing) {
            await database.delete(collectionItems)
                .where(eq(collectionItems.id, existing.id));
        }
        return { success: true, action: "deleted" };
    }

    if (existing) {
        await database.update(collectionItems)
            .set({ quantity: quantity })
            .where(eq(collectionItems.id, existing.id));
        return { success: true, action: "updated", id: existing.id };
    } else {
        const result = await database.insert(collectionItems)
            .values({
                collectionId,
                cardId,
                variant: variantValue,
                quantity: quantity
            })
            .returning({ id: collectionItems.id });
        return { success: true, action: "created", id: result[0].id };
    }
}
