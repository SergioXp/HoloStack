import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Crear conexión a SQLite
const sqlite = new Database("sqlite.db");

// Exportar instancia de Drizzle
export const db = drizzle(sqlite, { schema });
