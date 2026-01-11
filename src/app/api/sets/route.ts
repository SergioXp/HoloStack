import { db } from "@/db";
import { sets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const allSets = await db.select().from(sets);
        return Response.json({
            count: allSets.length,
            sets: allSets
        });
    } catch (error) {
        return Response.json({ error: "Error al leer sets" }, { status: 500 });
    }
}
