import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Database Indexing Flow', () => {
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

    test('Full indexing process (Partial Check)', async () => {
        await window.goto('http://localhost:3000/explorer');

        // Detect state without failing
        const emptyState = window.locator('text="Base de datos vacía"');
        const eraCard = window.locator('div.group.relative').first();

        const isDBEmpty = await emptyState.isVisible();

        if (isDBEmpty) {
            console.log('Database empty, proceeding with sync test...');
            const syncMenuButton = window.locator('button:has-text("Sincronizar")').first();
            await syncMenuButton.click();

            const startSyncButton = window.locator('button:has-text("Iniciar Sincronización")');
            await startSyncButton.click();

            const progressCount = window.locator('span.font-bold:has-text("%")');
            await expect(async () => {
                const progressText = await progressCount.textContent();
                const progress = parseInt(progressText?.replace('%', '') || '0');
                expect(progress).toBeGreaterThan(0);
            }).toPass({ timeout: 60000 });
        } else {
            console.log('Database already has data. Verifying visibility.');
            await expect(eraCard).toBeVisible();
        }
    });
});
