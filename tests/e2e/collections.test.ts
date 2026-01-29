import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Collections Management', () => {
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
        await electronApp.close();
    });

    test('Create a Manual Collection', async () => {
        await window.goto('http://localhost:3000/collections/new');

        // Choose "Manual" mode
        // We search for a text that identifies the manual option
        // In es.json: "collectionForm.manual.title": "Manual"
        const manualOption = window.locator('h3:has-text("Manual")').locator('xpath=..');
        await manualOption.click();

        // Fill the name
        const uniqueName = `Test Manual ${Date.now()}`;
        await window.fill('#name', uniqueName);

        // Click create button
        // In es.json: "collectionForm.createButton": "Crear Colección"
        const createButton = window.locator('button:has-text("Crear Colección")');
        await createButton.click();

        // It should redirect to the collection page /collections/[id]
        await window.waitForURL('**/collections/**', { timeout: 15000 });

        // Verify the title in the new page
        const collectionTitle = await window.textContent('h1');
        expect(collectionTitle).toBe(uniqueName);
    });

    test('Create an Auto Collection (Mocked Set)', async () => {
        await window.goto('http://localhost:3000/collections/new');

        // Choose "Automática" mode
        const autoOption = window.locator('h3:has-text("Automática")').locator('xpath=..');
        await autoOption.click();

        // Choose "Por Set" tab (it is default but let's be sure)
        const setTab = window.locator('button:has-text("Por Set")');
        await setTab.click();

        // Fill the name
        const uniqueName = `Test Auto ${Date.now()}`;
        await window.fill('#name', uniqueName);

        // Select a set if available
        const setSelect = window.locator('select#set');
        const optionsCount = await setSelect.locator('option').count();

        if (optionsCount > 1) {
            await setSelect.selectOption({ index: 1 });

            const createButton = window.locator('button:has-text("Crear Colección")');
            await createButton.click();

            await window.waitForURL('**/collections/**', { timeout: 15000 });
            const collectionTitle = await window.textContent('h1');
            expect(collectionTitle).toBe(uniqueName);
        }
    });
});
