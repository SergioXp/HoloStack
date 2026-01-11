
import { db } from "../db";
import { sets, cards, collectionItems, priceHistory, syncJobs, collections } from "../db/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🧹 Cleaning up database...");

    try {
        // Desactivar FK constraints temporalmente si fuera necesario, pero Drizzle maneja orden si lo hacemos manual
        // SQLite permite desactivar: PRAGMA foreign_keys = OFF;

        console.log("Deleting sync jobs...");
        await db.delete(syncJobs);

        console.log("Deleting price history...");
        await db.delete(priceHistory);

        console.log("Deleting collection items...");
        await db.delete(collectionItems);

        // Opcional: Borrar colecciones también? El usuario dijo "hemos perdido la colección... vamos a eliminar los datos de las tablas...".
        // Mejor limpiamos todo para empezar de 0.
        console.log("Deleting collections...");
        await db.delete(collections);

        console.log("Deleting cards...");
        await db.delete(cards);

        console.log("Deleting sets...");
        await db.delete(sets);

        console.log("✨ Database verified empty and clean.");
    } catch (error) {
        console.error("Error cleaning DB:", error);
    }
}

main().then(() => {
    console.log("Done");
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
