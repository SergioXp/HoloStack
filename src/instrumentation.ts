export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // 1. Evitar ejecuciones duplicadas en el mismo hilo de memoria
        if ((global as any)._is_migrating) return;
        (global as any)._is_migrating = true;

        const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
        const { getDb } = await import("@/db");
        const path = await import("path");
        const fs = await import("fs");

        const { db, sqlite } = getDb();

        // 2. Lock por archivo para procesos paralelos de Docker
        const lockFile = path.join(process.cwd(), "data", ".migration.lock");

        try {
            if (fs.existsSync(lockFile)) {
                const stats = fs.statSync(lockFile);
                if (Date.now() - stats.mtimeMs < 10000) return;
            }
            fs.writeFileSync(lockFile, Date.now().toString());

            // 3. ¡LA CLAVE! Verificación manual antes de migrar
            // Si la tabla 'users' ya existe, es que la DB ya está inicializada
            const tableCheck = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

            if (tableCheck) {
                console.log("ℹ️ La base de datos ya contiene tablas. Sincronización omitida.");
            } else {
                console.log("⏳ Base de datos vacía. Aplicando migraciones iniciales...");
                const migrationsFolder = path.join(process.cwd(), "drizzle");
                await migrate(db, { migrationsFolder });
                console.log("✅ Migraciones completadas con éxito.");
            }

        } catch (error: any) {
            const errorMsg = (error.message || "") + (error.cause?.message || "");
            if (errorMsg.toLowerCase().includes("already exists")) {
                console.log("ℹ️ Nota: Las tablas ya existen (detectado por error de colisión).");
            } else {
                console.error("❌ Error crítico en base de datos:", error);
            }
        } finally {
            if (fs.existsSync(lockFile)) {
                try { fs.unlinkSync(lockFile); } catch (e) { }
            }
        }
    }
}
