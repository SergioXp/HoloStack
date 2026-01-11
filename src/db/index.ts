import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Crear conexión a SQLite
// Crear conexión a SQLite
const dbPath = process.env.DATABASE_FILE || "sqlite.db";
const sqlite = new Database(dbPath);

// Exportar instancia de Drizzle
export const db = drizzle(sqlite, { schema });
