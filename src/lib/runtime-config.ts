import fs from "fs";
import path from "path";

interface RuntimeConfig {
    DATABASE_FILE?: string;
    APP_MODE?: string;
}

let cachedConfig: RuntimeConfig | null = null;

/**
 * Reads runtime configuration from runtime-config.json
 * This file is written by Electron at startup to pass dynamic values
 * that can't be passed via environment variables (Next.js standalone bakes them at build time)
 */
export function getRuntimeConfig(): RuntimeConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const runtimeConfigPath = path.join(process.cwd(), 'runtime-config.json');
    if (fs.existsSync(runtimeConfigPath)) {
        try {
            cachedConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf-8'));
            console.log('📄 Loaded runtime config:', cachedConfig);
            return cachedConfig!;
        } catch (e) {
            console.error('Error reading runtime-config.json:', e);
        }
    }

    cachedConfig = {};
    return cachedConfig;
}

/**
 * Gets the APP_MODE setting.
 * Priority: 1. runtime-config.json (Electron), 2. env var, 3. default "SERVER"
 */
export function getAppMode(): "LOCAL" | "SERVER" {
    const config = getRuntimeConfig();

    // 1. From runtime config (Electron)
    if (config.APP_MODE) {
        return config.APP_MODE as "LOCAL" | "SERVER";
    }

    // 2. From env var (Docker/dev)
    if (process.env.APP_MODE) {
        return process.env.APP_MODE as "LOCAL" | "SERVER";
    }

    // 3. Default to SERVER (require login)
    return "SERVER";
}
