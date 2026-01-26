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
        // En Electron empaquetado, usamos el directorio de la DB (que es escribible)
        // En desarrollo/Docker, usamos process.cwd()/data
        const dbFile = process.env.DATABASE_FILE;
        const lockDir = dbFile ? path.dirname(dbFile) : path.join(process.cwd(), "data");
        const lockFile = path.join(lockDir, ".migration.lock");

        // Asegurar que el directorio exista
        if (!fs.existsSync(lockDir)) {
            fs.mkdirSync(lockDir, { recursive: true });
        }

        try {
            if (fs.existsSync(lockFile)) {
                const stats = fs.statSync(lockFile);
                if (Date.now() - stats.mtimeMs < 10000) return;
            }
            fs.writeFileSync(lockFile, Date.now().toString());

            // 3. Ejecutar migraciones SIEMPRE para mantener el esquema actualizado
            // Drizzle gestiona automáticamente qué migraciones faltan por aplicar.
            console.log("🔍 Verificando estado del esquema de base de datos...");

            // Resolve migrations folder depending on environment
            // In standalone/prod, it might be in ./drizzle or ../../drizzle depending on copy
            let migrationsFolder = path.join(process.cwd(), "drizzle");
            if (!fs.existsSync(migrationsFolder)) {
                // Try looking in app root if we are in next standalone nested structure
                const altPath = path.resolve(process.cwd(), "../../drizzle");
                if (fs.existsSync(altPath)) migrationsFolder = altPath;
            }

            if (fs.existsSync(migrationsFolder)) {
                console.log(`🚀 Aplicando migraciones desde: ${migrationsFolder}`);
                await migrate(db, { migrationsFolder });
                console.log("✅ Esquema sincronizado correctamente.");
            } else {
                console.error(`⚠️ No se encontró la carpeta de migraciones en: ${migrationsFolder}`);
                // In dev, usually exists. In prod, ensure it is copied.
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
