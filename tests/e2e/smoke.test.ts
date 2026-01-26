import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import path from 'path';

test('App starts and shows home page', async () => {
    // Launch Electron with the main entry point
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../../dist-electron/main.js')],
        env: {
            ...process.env,
            NODE_ENV: 'production', // Simulate production
            APP_MODE: 'LOCAL'       // Avoid login screen for smoke test
        }
    });

    // Wait for the first window to be opened
    const window = await electronApp.firstWindow();

    // Wait for the internal server to be ready
    // (Our server usually takes ~5-10s to start in the background)
    await window.waitForURL('http://localhost:3000/**', { timeout: 30000 });

    // Check if Title contains HoloStack
    const title = await window.title();
    expect(title).toContain('HoloStack');

    // Take a screenshot
    const screenshotPath = path.join(process.cwd(), 'tests-results/smoke-screenshot.png');
    await window.screenshot({ path: screenshotPath });

    // Get log path and print it for CI to find it easily
    const userDataPath = await electronApp.evaluate(async ({ app }) => {
        return app.getPath('userData');
    });
    console.log(`Application Log Path: ${path.join(userDataPath, 'main.log')}`);

    // Close the app
    await electronApp.close();
});
