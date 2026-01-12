import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems } from "@/db/schema";
import { gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const items = await db
            .select({
                cardId: collectionItems.cardId,
                quantity: collectionItems.quantity,
            })
            .from(collectionItems)
            .where(gt(collectionItems.quantity, 0));

        // Group by cardId (in case user has the same card in multiple collections or variants)
        const ownership: Record<string, number> = {};

        for (const item of items) {
            ownership[item.cardId] = (ownership[item.cardId] || 0) + (item.quantity || 0);
        }

        return NextResponse.json(ownership);
    } catch (error) {
        console.error("Error fetching ownership:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
