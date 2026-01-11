import { db } from "@/db";
import { collections } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, filters, userId, language } = body;

        if (!name || !type) {
            return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const [newCollection] = await db.insert(collections).values({
            name,
            type,
            filters: filters ? JSON.stringify(filters) : null,
            userId: userId || "guest", // Por ahora guest hasta tener auth real
            language: language || null, // null = usar idioma del perfil
        }).returning();

        revalidatePath("/collections");

        return Response.json(newCollection);
    } catch (error) {
        console.error("Error creando colección:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const allCollections = await db.select().from(collections);
        return Response.json(allCollections);
    } catch (error) {
        return Response.json({ error: "Error obteniendo colecciones" }, { status: 500 });
    }
}
