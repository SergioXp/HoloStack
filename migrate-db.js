const { drizzle } = require("drizzle-orm/better-sqlite3");
const { migrate } = require("drizzle-orm/better-sqlite3/migrator");
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DATABASE_FILE || "sqlite.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function main() {
    console.log("⏳ Aplicando migraciones...");
    try {
        await migrate(db, { migrationsFolder: path.join(__dirname, "drizzle") });
        console.log("✅ Base de datos lista.");
        sqlite.close();
    } catch (error) {
        console.error("❌ Error en migraciones:", error);
        process.exit(1);
    }
}

main();
