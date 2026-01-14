import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { manageCollectionItem } from "@/lib/collection-actions";

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

        const response = await manageCollectionItem(db, {
            collectionId,
            cardId,
            variant,
            quantity: quantity ?? 1
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error managing collection item:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
