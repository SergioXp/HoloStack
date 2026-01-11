import { db } from "@/db";
import { cards } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
    try {
        // Contar cartas agrupadas por setId
        const result = await db
            .select({
                setId: cards.setId,
                count: sql<number>`count(*)`.as("count"),
            })
            .from(cards)
            .groupBy(cards.setId);

        // Convertir a objeto { setId: count }
        const counts: Record<string, number> = {};
        for (const row of result) {
            counts[row.setId] = row.count;
        }

        return Response.json({ counts });
    } catch (error) {
        return Response.json({ error: "Error al contar cartas" }, { status: 500 });
    }
}
