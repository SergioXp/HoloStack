import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { collectionId, cardId, variant, quantity } = body;

        if (!collectionId || !cardId) {
            return NextResponse.json(
                { error: "collectionId and cardId are required" },
                { status: 400 }
            );
        }

        const variantValue = variant || "normal";
        const quantityValue = quantity ?? 1;

        // Buscar si ya existe un registro para esta carta/variante en esta colección
        const existing = await db.query.collectionItems.findFirst({
            where: and(
                eq(collectionItems.collectionId, collectionId),
                eq(collectionItems.cardId, cardId),
                eq(collectionItems.variant, variantValue)
            )
        });

        if (quantityValue <= 0) {
            // Si la cantidad es 0 o menos, eliminar el registro si existe
            if (existing) {
                await db.delete(collectionItems)
                    .where(eq(collectionItems.id, existing.id));
            }
            return NextResponse.json({ success: true, action: "deleted" });
        }

        if (existing) {
            // Actualizar el registro existente
            await db.update(collectionItems)
                .set({ quantity: quantityValue })
                .where(eq(collectionItems.id, existing.id));
            return NextResponse.json({ success: true, action: "updated", id: existing.id });
        } else {
            // Crear nuevo registro
            const result = await db.insert(collectionItems)
                .values({
                    collectionId,
                    cardId,
                    variant: variantValue,
                    quantity: quantityValue
                })
                .returning({ id: collectionItems.id });
            return NextResponse.json({ success: true, action: "created", id: result[0].id });
        }

    } catch (error) {
        console.error("Error managing collection item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
