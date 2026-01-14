import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";
import path from "path";

export async function runMigrations() {
    console.log("⏳ Ejecutando migraciones de la base de datos...");
    try {
        // En producción, las migraciones suelen estar en la carpeta 'drizzle' en la raíz
        await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
        console.log("✅ Migraciones completadas con éxito.");
    } catch (error) {
        console.error("❌ Error durante las migraciones:", error);
        process.exit(1);
    }
}

// Si se ejecuta este archivo directamente
if (require.main === module) {
    runMigrations();
}
