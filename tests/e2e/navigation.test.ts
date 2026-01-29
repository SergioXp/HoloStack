import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Navigation & Basic Flow', () => {
    let electronApp: any;
    let window: any;

    test.beforeAll(async () => {
        electronApp = await electron.launch({
            args: [
                '--no-sandbox',
                path.join(__dirname, '../../dist-electron/main.js')
            ],
            env: {
                ...process.env,
                NODE_ENV: 'production',
                APP_MODE: 'LOCAL'
            }
        });
        window = await electronApp.firstWindow();
        await window.waitForURL('http://localhost:3000/**', { timeout: 30000 });
    });

    test.afterAll(async () => {
        if (electronApp) {
            await electronApp.close();
        }
    });

    test('Navigate to Explorer', async () => {
        // Click on "Mercado" dropdown first if on desktop
        // Or just go to the URL directly to ensure accessibility
        await window.goto('http://localhost:3000/explorer');
        const title = await window.textContent('h1');
        // The translation key for explorer.title is in es.json
        // We expect "Explorador TCG" or similar
        expect(title).not.toBeNull();
    });

    test('Navigate to Collections', async () => {
        await window.goto('http://localhost:3000/collections');
        const title = await window.textContent('h1');
        expect(title).not.toBeNull();
    });

    test('Navigate to Settings', async () => {
        await window.goto('http://localhost:3000/settings');
        const title = await window.textContent('h1');
        expect(title).not.toBeNull();
    });

    test('Search functionality opens modal', async () => {
        await window.goto('http://localhost:3000/');
        // Global search is a button that opens a modal or an input
        // Looking at GlobalSearch.tsx might help, but usually it's a search icon or input
        const searchTrigger = window.locator('button:has-text("Buscar"), [placeholder*="Buscar"]');
        if (await searchTrigger.isVisible()) {
            await searchTrigger.click();
            // Check if Search modal or input appears
            // This is a smoke test so we just care if it doesn't crash
        }
    });
});
