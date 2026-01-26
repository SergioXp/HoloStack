
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const standaloneDir = path.join(__dirname, '../.next/standalone');
const electronVersion = '40.0.0'; // Hardcoded version to match package.json

console.log(`🚀 Rebuilding native modules in ${standaloneDir} for Electron ${electronVersion}...`);

if (!fs.existsSync(standaloneDir)) {
    console.error('❌ Standalone directory not found. Run "npm run build" first.');
    process.exit(1);
}

try {
    // Strategy: Build better-sqlite3 in a temp directory and copy it over
    // This prevents 'npm install' from bloating the standalone node_modules with full packages
    const tempBuildDir = path.join(__dirname, '../temp_native_build');

    if (fs.existsSync(tempBuildDir)) {
        fs.rmSync(tempBuildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempBuildDir);

    console.log(`🔨 Building better-sqlite3 in ${tempBuildDir}...`);

    // Initialize a minimal package.json
    fs.writeFileSync(path.join(tempBuildDir, 'package.json'), JSON.stringify({
        name: "temp-build",
        dependencies: {
            "better-sqlite3": "*" // Use latest version for best Electron/Node compatibility
        }
    }));

    const cmd = `npm install better-sqlite3 --force --runtime=electron --target=${electronVersion} --dist-url=https://electronjs.org/headers --build-from-source`;

    console.log(`> ${cmd}`);
    execSync(cmd, {
        cwd: tempBuildDir,
        stdio: 'inherit',
        env: {
            ...process.env,
            npm_config_runtime: 'electron',
            npm_config_target: electronVersion,
            npm_config_disturl: 'https://electronjs.org/headers',
            npm_config_build_from_source: 'true'
        }
    });

    // Replace the standalone module with the built one
    const targetModule = path.join(standaloneDir, 'node_modules', 'better-sqlite3');
    const sourceModule = path.join(tempBuildDir, 'node_modules', 'better-sqlite3');

    if (fs.existsSync(targetModule)) {
        console.log('🗑️ Removing existing better-sqlite3 in standalone...');
        fs.rmSync(targetModule, { recursive: true, force: true });
    }

    console.log('📦 Moving built better-sqlite3 to standalone...');
    fs.cpSync(sourceModule, targetModule, { recursive: true });

    // Cleanup temp
    fs.rmSync(tempBuildDir, { recursive: true, force: true });

    console.log('✅ Rebuild complete!');

    // ⚠️ CRITICAL: Remove data/ folder to prevent shipping user's database
    const dataDir = path.join(standaloneDir, 'data');
    if (fs.existsSync(dataDir)) {
        console.log('🔐 Removing data/ folder (prevents shipping user database)...');
        fs.rmSync(dataDir, { recursive: true, force: true });
    }

    // Cleanup other unnecessary standalone artifacts
    console.log('🧹 Cleaning up unnecessary dependencies...');
    const modulesToDelete = [
        'electron',
        'electron-builder',
        'app-builder-bin',
        'electron-winstaller',
        'typescript',
        'tailwindcss',
        'postcss',
        'eslint',
        'drizzle-kit',
        'vite',
        '@esbuild-kit',
        'lzma-native',
        '7zip-bin',
        'vitest',
        '@vitest',
        'jsdom',
        'cross-env',
        'concurrently'
    ];

    modulesToDelete.forEach(mod => {
        const modPath = path.join(standaloneDir, 'node_modules', mod);
        if (fs.existsSync(modPath)) {
            execSync(`rm -rf "${modPath}"`);
            console.log(`  - Removed ${mod}`);
        }
    });

    // Also remove .bin directory to avoid broken symlinks from deleted modules
    const binPath = path.join(standaloneDir, 'node_modules', '.bin');
    if (fs.existsSync(binPath)) {
        execSync(`rm -rf "${binPath}"`);
        console.log('  - Removed node_modules/.bin (cleanup broken symlinks)');
    }

    // Copy .next/static and public to standalone to ensure they are available
    console.log('📂 Copying static assets to standalone directory...');

    // Copy public
    const publicSrc = path.join(__dirname, '../public');
    const publicDest = path.join(standaloneDir, 'public');
    if (fs.existsSync(publicSrc)) {
        execSync(`cp -R "${publicSrc}" "${publicDest}"`);
        console.log('  - public folder copied');
    }

    // Copy .next/static to .next/standalone/.next/static
    const staticSrc = path.join(__dirname, '../.next/static');
    const staticDest = path.join(standaloneDir, '.next/static');

    // Ensure parent dir exists
    if (!fs.existsSync(path.join(standaloneDir, '.next'))) {
        fs.mkdirSync(path.join(standaloneDir, '.next'));
    }

    if (fs.existsSync(staticSrc)) {
        // Remove destination if exists to avoid stale files
        if (fs.existsSync(staticDest)) {
            execSync(`rm -rf "${staticDest}"`);
        }
        execSync(`cp -R "${staticSrc}" "${staticDest}"`);
        console.log('  - .next/static folder copied');
    }

    // Copy drizzle migrations to standalone
    const drizzleSrc = path.join(__dirname, '../drizzle');
    const drizzleDest = path.join(standaloneDir, 'drizzle');
    if (fs.existsSync(drizzleSrc)) {
        if (fs.existsSync(drizzleDest)) {
            execSync(`rm -rf "${drizzleDest}"`);
        }
        execSync(`cp -R "${drizzleSrc}" "${drizzleDest}"`);
        console.log('  - drizzle folder copied');
    }

} catch (error) {
    console.error('❌ Rebuild/Copy failed:', error);
    process.exit(1);
}
