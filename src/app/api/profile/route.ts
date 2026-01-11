import { NextResponse } from "next/server";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const GUEST_USER_ID = "guest";

// GET - Obtener perfil del usuario
export async function GET() {
    try {
        let profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, GUEST_USER_ID),
        });

        // Si no existe, crear uno con valores por defecto
        if (!profile) {
            const [newProfile] = await db.insert(userProfiles).values({
                userId: GUEST_USER_ID,
                displayName: "Coleccionista",
                appLanguage: "es",
                cardLanguage: "en",
            }).returning();
            profile = newProfile;
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Error fetching profile" }, { status: 500 });
    }
}

// PUT - Actualizar perfil del usuario
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        // Buscar perfil existente
        const profile = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, GUEST_USER_ID),
        });

        if (!profile) {
            // Crear si no existe
            const [newProfile] = await db.insert(userProfiles).values({
                userId: GUEST_USER_ID,
                displayName: body.displayName || "Coleccionista",
                appLanguage: body.appLanguage || "es",
                cardLanguage: body.cardLanguage || "en",
                cardmarketUsername: body.cardmarketUsername,
                tcgplayerUsername: body.tcgplayerUsername,
                ebayUsername: body.ebayUsername,
                preferredCurrency: body.preferredCurrency || "EUR",
            }).returning();
            return NextResponse.json(newProfile);
        }

        // Actualizar perfil existente
        const [updatedProfile] = await db.update(userProfiles)
            .set({
                displayName: body.displayName,
                appLanguage: body.appLanguage,
                cardLanguage: body.cardLanguage,
                cardmarketUsername: body.cardmarketUsername,
                tcgplayerUsername: body.tcgplayerUsername,
                ebayUsername: body.ebayUsername,
                preferredCurrency: body.preferredCurrency,
                updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, GUEST_USER_ID))
            .returning();

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Error updating profile" }, { status: 500 });
    }
}
