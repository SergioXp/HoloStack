import { app, BrowserWindow, shell, dialog, net } from 'electron';
import path from 'path';
import { fork, spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;
let nextServerProcess: any = null;
let serverPort = 3000;


const isDev = process.env.NODE_ENV === 'development';

const logFile = path.join(app.getPath('userData'), 'main.log');

function logToFile(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        // Fallback to original console error if writing fails (avoid loop)
        originalConsoleError("Failed to write to log file:", error);
    }
}

// --- App Logic ---

/**
 * Generates a runtime configuration file to pass dynamic absolute paths to Next.js.
 * This solves the issue where process.cwd() is '/' in packaged Mac apps.
 */
function writeRuntimeConfig() {
    try {
        const userDataPath = app.getPath('userData');
        const dbDir = path.join(userDataPath, 'data');
        const dbFile = path.join(dbDir, 'sqlite.db');
        const configPath = path.join(userDataPath, 'runtime-config.json');

        // Ensure DB directory exists
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            logToFile(`📁 Created database directory: ${dbDir}`);
        }

        const config = {
            DATABASE_FILE: dbFile,
            APP_MODE: "LOCAL" // Always LOCAL mode when running via Electron
        };

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logToFile(`📄 Written runtime config to: ${configPath}`);

        // Inject environment variable so Next.js knows where to look
        process.env.RUNTIME_CONFIG_PATH = configPath;
        logToFile(`🔧 Set RUNTIME_CONFIG_PATH=${configPath}`);

        return configPath;
    } catch (error: any) {
        logToFile(`❌ Failed to write runtime config: ${error.message}`);
        return null;
    }
}
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    logToFile(`[INFO] ${message}`);
    originalConsoleLog.apply(console, args);
};

console.error = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    logToFile(`[ERROR] ${message}`);
    originalConsoleError.apply(console, args);
};

// Correctly resolve standalone path in Production (ASAR) vs Development
const DIST_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', '.next', 'standalone')
    : path.join(__dirname, '../.next/standalone');

logToFile(`Starting App. Packaged: ${app.isPackaged}`);
logToFile(`DIST_PATH: ${DIST_PATH}`);

// -----------------------------------------------------------------------------
// IN-PROCESS SERVER STARTUP (SECURE)
// -----------------------------------------------------------------------------

/**
 * Patches Node.js module resolution and process methods to work inside ASAR.
 * This is the "Magic" that allows Next.js to run in-process without unpacking source code.
 */
function applyDoNotUnpackPatches() {
    logToFile("🔧 Applying ASAR patches for In-Process execution...");

    // Patch 1: process.chdir
    const originalChdir = process.chdir;
    process.chdir = (directory: string) => {
        try {
            originalChdir(directory);
        } catch (err: any) {
            // Ignore chdir errors inside ASAR
        }
    };

    // Patch 2: Module._resolveFilename
    const Module = require('module');
    const originalResolveFilename = Module._resolveFilename;

    Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
        // PROACTIVE PATCH: Redirect native modules before they fail
        // Next.js uses hashed names like 'better-sqlite3-xxxx', so we use includes()
        if (app.isPackaged && (request.includes('better-sqlite3') || request.includes('sharp'))) {
            const pkgName = request.includes('better-sqlite3') ? 'better-sqlite3' : 'sharp';

            // Try 1: Root node_modules (rebuilt by electron-builder - MOST RELIABLE)
            const rootUnpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', pkgName);
            // Try 2: Standalone node_modules (fallback)
            const standaloneUnpacked = path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'node_modules', pkgName);

            const finalPath = fs.existsSync(rootUnpacked) ? rootUnpacked : (fs.existsSync(standaloneUnpacked) ? standaloneUnpacked : null);

            if (finalPath) {
                return originalResolveFilename.call(this, finalPath, parent, isMain, options);
            }
        }

        // Standard try-catch for everything else
        try {
            return originalResolveFilename.call(this, request, parent, isMain, options);
        } catch (err: any) {
            if (app.isPackaged && err.code === 'MODULE_NOT_FOUND') {
                // Secondary recovery for .node files (often loaded relatively inside of node_modules)
                if (request.endsWith('.node') && parent?.filename) {
                    const unpackedParentDir = path.dirname(parent.filename).replace('app.asar', 'app.asar.unpacked');
                    const targetPath = path.resolve(unpackedParentDir, request);
                    if (fs.existsSync(targetPath)) {
                        logToFile(`[PATCH RECOVERY] Redirected .node ${request} -> ${targetPath}`);
                        return targetPath;
                    }
                }
            }
            throw err;
        }
    };
}

async function startNextServer(): Promise<number> {
    return new Promise(async (resolve, reject) => {
        const port = 3000;

        if (!app.isPackaged) {
            // --- DEVELOPMENT MODE ---
            logToFile("Starting DEV server via spawn...");
            const nextProcess = spawn('npm', ['run', 'dev'], {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit',
                env: { ...process.env, PORT: port.toString() }
            });
            nextProcess.on('error', (err) => reject(err));
            setTimeout(() => resolve(port), 5000);
            return;
        }

        // --- PRODUCTION MODE (Fork Process) ---
        try {
            logToFile("🚀 Starting PROD server via FORK (UNPACKED)...");

            // 1. Prepare Environment
            writeRuntimeConfig();
            // No patches needed if we run from unpacked!

            // Full path to UNPACKED standalone server.js
            const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', '.next/standalone/server.js');
            const standaloneRoot = path.dirname(serverPath);

            logToFile(`Server Path: ${serverPath}`);
            logToFile(`Standalone Root (CWD): ${standaloneRoot}`);

            if (!fs.existsSync(serverPath)) {
                logToFile(`❌ ERROR: Ready-to-run server not found at ${serverPath}`);
                reject(new Error("Server binary missing"));
                return;
            }

            // 2. Setup Env Vars
            const env = {
                ...process.env,
                NODE_ENV: 'production',
                PORT: port.toString(),
                HOSTNAME: 'localhost',
                RUNTIME_CONFIG_PATH: process.env.RUNTIME_CONFIG_PATH,
                DATABASE_FILE: process.env.DATABASE_FILE // Extra safety
            } as any;

            // 3. Fork the server
            // Using fork() on server.js inside ASAR works because Electron patches fork/spawn
            nextServerProcess = fork(serverPath, [], {
                env,
                stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
                cwd: standaloneRoot
            });

            // 4. Capture Server Logs
            nextServerProcess.stdout.on('data', (data: any) => {
                logToFile(`[SERVER] ${data.toString().trim()}`);
            });

            nextServerProcess.stderr.on('data', (data: any) => {
                const msg = data.toString().trim();
                logToFile(`[SERVER ERROR] ${msg}`);
            });

            nextServerProcess.on('error', (err: any) => {
                logToFile(`❌ Server process failed: ${err.message}`);
                reject(err);
            });

            nextServerProcess.on('exit', (code: number) => {
                logToFile(`⚠️ Server process exited with code ${code}`);
                // If it crashes during startup, the poll will fail and we'll handle it
            });

            // 5. Wait for readiness
            logToFile("⏳ Waiting for server to become ready...");
            await pollServer(port);
            logToFile("✅ Server is READY.");
            resolve(port);

        } catch (err: any) {
            logToFile(`❌ Failed to start server: ${err.message}`);
            logToFile(`Stack: ${err.stack}`);
            reject(err);
        }
    });
}
async function pollServer(port: number): Promise<void> {
    const maxRetries = 30; // Wait up to 30 seconds
    const interval = 1000;
    const url = `http://localhost:${port}`;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.get(url, (res) => {
                    // Accept any 2xx or 3xx status as "server is ready"
                    // (3xx means redirect to login, which is valid)
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                        resolve();
                    } else {
                        reject(new Error(`Status code: ${res.statusCode}`));
                    }
                });
                req.on('error', reject);
                req.end();
            });
            logToFile('Server detected as ready!');
            return;
        } catch (err) {
            logToFile(`Waiting for server... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    throw new Error('Server detected as ready timeout');
}

async function checkForUpdates() {
    const currentVersion = app.getVersion();
    logToFile(`Checking for updates... Current version: ${currentVersion}`);

    try {
        const response = await net.fetch('https://api.github.com/repos/SergioXp/HoloStack/releases/latest');
        if (!response.ok) throw new Error(`GitHub API Error: ${response.statusText}`);

        const data = await response.json();
        const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');

        logToFile(`Latest version on GitHub: ${latestVersion}`);

        // Compare versions semantically (borrowed logic from frontend)
        const hasNewerVersion = (current: string, remote: string) => {
            const cleanVersion = (v: string) => v.replace(/^v/, '').split('.').map(Number);
            const currentParts = cleanVersion(current);
            const remoteParts = cleanVersion(remote);

            for (let i = 0; i < 3; i++) {
                const c = currentParts[i] || 0;
                const r = remoteParts[i] || 0;
                if (r > c) return true;
                if (r < c) return false;
            }
            return false;
        };

        if (latestVersion && hasNewerVersion(currentVersion, latestVersion)) {
            const { response } = await dialog.showMessageBox({
                type: 'info',
                buttons: ['Descargar', 'Más tarde'],
                defaultId: 0,
                title: 'Nueva Versión Disponible',
                message: `HoloStack v${latestVersion} está disponible.`,
                detail: '¿Quieres descargar la última versión ahora?',
                icon: path.join(__dirname, '../public/icon.png')
            });

            if (response === 0) {
                shell.openExternal(data.html_url);
            }
        }
    } catch (error: any) {
        logToFile(`Update check failed: ${error.message}`);
    }
}

function createWindow(port: number) {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0f172a',
        show: false,
    });

    // Open DevTools to debug renderer issues
    // mainWindow.webContents.openDevTools();

    const url = `http://localhost:${port}`;
    logToFile(`Loading URL: ${url}`);
    console.log(`Loading URL: ${url}`);

    mainWindow.loadURL(url).catch(e => {
        logToFile(`Failed to load URL: ${e}`);
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        logToFile(`Page failed to load: ${errorCode} ${errorDescription}`);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        // Check for updates shortly after launch
        setTimeout(checkForUpdates, 3000);
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Imports removed to avoid load issues

app.whenReady().then(async () => {
    try {
        const port = await startNextServer();

        // Run migrations was removed because it caused ABI incompatibility issues in the Main Process.
        // Next.js (child process) handles migrations on startup.

        createWindow(port);
        // ...

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
        });
    } catch (err) {
        logToFile(`Failed to initialize app: ${err}`);
        console.error('Failed to initialize app:', err);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (nextServerProcess) {
        logToFile('Killing Next.js server...');
        console.log('Killing Next.js server...');
        nextServerProcess.kill();
    }
});
