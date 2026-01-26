const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const standaloneDir = path.join(__dirname, '../.next/standalone');

console.log(`🚀 Optimizing standalone directory: ${standaloneDir}`);

if (!fs.existsSync(standaloneDir)) {
    console.error('❌ Standalone directory not found. Run "npm run build" first.');
    process.exit(1);
}

try {
    console.log('✅ Starting standalone optimization...');

    // ⚠️ CRITICAL: Remove data/ folder to prevent shipping user's database
    const dataDir = path.join(standaloneDir, 'data');
    if (fs.existsSync(dataDir)) {
        console.log('🔐 Removing data/ folder (prevents shipping user database)...');
        fs.rmSync(dataDir, { recursive: true, force: true });
    }

    // We no longer remove better-sqlite3 or sharp here because they are marked 
    // as serverExternalPackages in next.config.ts, so Next.js needs them 
    // to be present in the standalone node_modules.

    const otherModulesToDelete = [
        'electron',
        'electron-builder',
        'app-builder-bin',
        'app-builder-lib',
        'typescript',
        'tailwindcss',
        'postcss',
        'eslint',
        'drizzle-kit',
        'vite',
        'vitest',
        'jsdom',
        'cross-env',
        'concurrently'
    ];

    otherModulesToDelete.forEach(mod => {
        const modPath = path.join(standaloneDir, 'node_modules', mod);
        if (fs.existsSync(modPath)) {
            execSync(`rm -rf "${modPath}"`);
            console.log(`  - Removed ${mod}`);
        }
    });

    // 🔄 Sync rebuilt native modules from root to standalone
    console.log('🔄 Syncing rebuilt native modules to standalone...');
    const nativeModules = ['better-sqlite3', 'sharp', 'bindings', 'file-uri-to-path'];
    nativeModules.forEach(mod => {
        const srcPath = path.join(__dirname, '../node_modules', mod);
        const destPath = path.join(standaloneDir, 'node_modules', mod);
        if (fs.existsSync(srcPath)) {
            if (!fs.existsSync(path.dirname(destPath))) {
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
            }
            if (fs.existsSync(destPath)) execSync(`rm -rf "${destPath}"`);
            execSync(`cp -R "${srcPath}" "${destPath}"`);
            console.log(`  - ${mod} synced to standalone`);
        }
    });

    // Copy .next/static and public to standalone
    console.log('📂 Copying static assets to standalone directory...');
    const assets = [
        { src: '../public', dest: 'public' },
        { src: '../.next/static', dest: '.next/static' },
        { src: '../drizzle', dest: 'drizzle' }
    ];

    assets.forEach(({ src, dest }) => {
        const srcPath = path.join(__dirname, src);
        const destPath = path.join(standaloneDir, dest);
        if (fs.existsSync(srcPath)) {
            const parentDir = path.dirname(destPath);
            if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
            if (fs.existsSync(destPath)) execSync(`rm -rf "${destPath}"`);
            execSync(`cp -R "${srcPath}" "${destPath}"`);
            console.log(`  - ${dest} copied`);
        }
    });

} catch (error) {
    console.error('❌ Standalone optimization failed:', error);
    process.exit(1);
}
