import { app, BrowserWindow, shell, dialog, net } from 'electron';
import path from 'path';
import { fork } from 'child_process';
import http from 'http';
import fs from 'fs';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null = null;
let nextServerProcess: any = null;
let serverPort = 3000;

// Determine if we are in development mode
const isDev = process.env.NODE_ENV === 'development';

const logFile = path.join(app.getPath('userData'), 'main.log');

function logToFile(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        console.error("Failed to write to log file:", error);
    }
}

// Correctly resolve standalone path in Production (ASAR) vs Development
const DIST_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone')
    : path.join(__dirname, '../.next/standalone');

logToFile(`Starting App. Packaged: ${app.isPackaged}`);
logToFile(`DIST_PATH: ${DIST_PATH}`);

function findFreePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.listen(startPort, () => {
            const address = server.address();
            server.close(() => {
                if (address && typeof address !== 'string') {
                    resolve(address.port);
                } else {
                    resolve(startPort);
                }
            });
        });
        server.on('error', () => {
            findFreePort(startPort + 1).then(resolve, reject);
        });
    });
}

async function startNextServer() {
    const dbPath = path.join(app.getPath('userData'), 'sqlite.db');
    logToFile(`Configuring DB Path: ${dbPath}`);
    console.log(`Configuring DB Path: ${dbPath}`);

    if (isDev) {
        console.log('In Dev mode: Assuming Next.js is already running on port 3000');
        return 3000;
    }

    serverPort = await findFreePort(3000);
    logToFile(`Starting Next.js standalone server on port ${serverPort}...`);
    console.log(`Starting Next.js standalone server on port ${serverPort}...`);

    const serverPath = path.join(DIST_PATH, 'server.js');
    logToFile(`Server Path: ${serverPath}`);

    if (!fs.existsSync(serverPath)) {
        const errorMsg = `Next.js standalone build not found at: ${serverPath}`;
        logToFile(errorMsg);
        throw new Error(errorMsg);
    }

    // Use fork() in production to run with the bundled Electron Node runtime
    // This avoids requiring the user to have Node.js installed
    nextServerProcess = fork(serverPath, [], {
        env: {
            ...process.env,
            PORT: serverPort.toString(),
            HOST: '127.0.0.1',
            DATABASE_FILE: dbPath // Inject dynamic DB path
        },
        cwd: DIST_PATH,
        stdio: 'pipe' // Pipe output to capture logs
    });

    nextServerProcess.stdout?.on('data', (data: any) => {
        logToFile(`[Next.js stdout] ${data}`);
        console.log(`[Next.js] ${data}`);
    });

    nextServerProcess.stderr?.on('data', (data: any) => {
        logToFile(`[Next.js stderr] ${data}`);
        console.error(`[Next.js] ${data}`);
    });

    nextServerProcess.on('error', (err: any) => {
        logToFile(`Failed to start Next.js server: ${err}`);
        console.error('Failed to start Next.js server:', err);
    });

    nextServerProcess.on('exit', (code: number, signal: string) => {
        logToFile(`Next.js server exited with code ${code} and signal ${signal}`);
    });

    // Poll for the server to be ready
    await pollServer(serverPort);
    return serverPort;
}

async function pollServer(port: number): Promise<void> {
    const maxRetries = 30; // Wait up to 30 seconds
    const interval = 1000;
    const url = `http://localhost:${port}`;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.get(url, (res) => {
                    if (res.statusCode === 200) {
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

        if (latestVersion && latestVersion !== currentVersion) {
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

app.whenReady().then(async () => {
    try {
        const port = await startNextServer();
        createWindow(port);

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
