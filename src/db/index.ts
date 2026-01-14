import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Función para obtener la ruta de la DB de forma segura
function getDbPath() {
    return process.env.DATABASE_FILE || "data/sqlite.db";
}

// Singleton para la instancia de SQLite
let sqliteInstance: Database.Database | null = null;
let drizzleInstance: BetterSQLite3Database<typeof schema> | null = null;

export function getDb() {
    if (!drizzleInstance) {
        const dbPath = getDbPath();
        const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
        const dbDir = path.dirname(absolutePath);

        if (!fs.existsSync(dbDir)) {
            console.log(`📁 Creando directorio para la base de datos: ${dbDir}`);
            fs.mkdirSync(dbDir, { recursive: true });
        }

        console.log(`🗄️ Conectando a la base de datos en: ${absolutePath}`);
        sqliteInstance = new Database(absolutePath);
        drizzleInstance = drizzle(sqliteInstance, { schema });
    }
    return { db: drizzleInstance, sqlite: sqliteInstance as Database.Database };
}

// Inicializar y exportar
const connection = getDb();
export const db = connection.db;
export const sqlite = connection.sqlite;
