import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Explorer & Sets', () => {
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

    test('Navigate through eras in Explorer', async () => {
        await window.goto('http://localhost:3000/explorer');

        // Check if some era is listed
        // Eras are usually large cards with names like "Scarlet & Violet", "Sword & Shield", etc.
        const eraCard = window.locator('div:has-text("Scarlet & Violet"), div:has-text("Escarlata y Púrpura")').first();

        if (await eraCard.isVisible()) {
            await eraCard.click();

            // Should navigate to /explorer/[era]
            await window.waitForURL('**/explorer/**', { timeout: 10000 });

            // Check if sets are listed
            const setCard = window.locator('div:has-text("cartas")').first();
            expect(await setCard.isVisible()).toBeTruthy();
        }
    });

    test('Search in Explorer', async () => {
        await window.goto('http://localhost:3000/explorer');

        const searchInput = window.getByPlaceholder('Buscar expansión o ID (ej. PFL)...');
        if (await searchInput.isVisible()) {
            await searchInput.fill('151');
            // Wait for results
            await window.waitForTimeout(1000);
            // In the Explorer, searching for 151 shows the "Scarlet & Violet" era
            const era151 = window.locator('text="Scarlet & Violet"').first();
            await expect(era151).toBeVisible();
        }
    });
});
