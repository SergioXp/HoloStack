import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Función para obtener la ruta de la DB de forma segura
function getDbPath() {
    // 1. Try runtime config file (explicit path from Electron or fallback to cwd)
    const runtimeConfigPath = process.env.RUNTIME_CONFIG_PATH || path.join(process.cwd(), 'runtime-config.json');
    console.log(`🔍 Checking runtime config at: ${runtimeConfigPath}`);

    if (fs.existsSync(runtimeConfigPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf-8'));
            if (config.DATABASE_FILE) {
                console.log(`🔍 Using DATABASE_FILE from runtime-config.json: ${config.DATABASE_FILE}`);
                return config.DATABASE_FILE;
            }
        } catch (e) {
            console.error('Error reading runtime-config.json:', e);
        }
    } else {
        console.log(`⚠️ Runtime config not found at: ${runtimeConfigPath}`);
        // Debug environment
        console.log(`DEBUG: process.env.DATABASE_FILE = ${process.env.DATABASE_FILE}`);
    }

    // 2. Then try environment variable (works in Docker and real dev)
    // Only use if it's an absolute path (to avoid using baked build-time values)
    const envDbFile = process.env.DATABASE_FILE;
    if (envDbFile && path.isAbsolute(envDbFile)) {
        console.log(`🔍 Using DATABASE_FILE from env: ${envDbFile}`);
        return envDbFile;
    }

    // 3. Fallback to default (dev mode)
    console.log(`🔍 Using default DATABASE_FILE: data/sqlite.db`);
    return "data/sqlite.db";
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
// Lazy getters - only connect when actually needed
// This ensures DATABASE_FILE is read at runtime, not build time
export function getConnection() {
    return getDb();
}

// For backwards compatibility
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
    get(_, prop) {
        return (getDb().db as any)[prop];
    }
});

export const sqlite = new Proxy({} as Database.Database, {
    get(_, prop) {
        const instance = getDb().sqlite;
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    }
});
