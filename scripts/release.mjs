import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Colores para la consola
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

try {
    // 1. Leer versión de package.json
    const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
    const version = pkg.version;
    const tag = `v${version}`;

    console.log(`\n🚀 ${blue('Iniciando proceso de lanzamiento para')} ${green(tag)}...\n`);

    // 2. Sincronizar con src/lib/constants/version.ts
    console.log(`🔄 Sincronizando constantes de versión...`);
    const versionFile = './src/lib/constants/version.ts';
    let content = readFileSync(versionFile, 'utf8');
    content = content.replace(/APP_VERSION = ".*?"/, `APP_VERSION = "${version}"`);
    writeFileSync(versionFile, content);
    console.log(`✅ ${green('Sincronizado:')} ${versionFile}`);

    // 3. Git Add & Commit
    console.log(`📦 Preparando commit de release...`);
    execSync('git add .', { stdio: 'inherit' });

    // Ver si hay cambios para evitar error de "nothing to commit"
    const status = execSync('git status --porcelain').toString();
    if (status) {
        execSync(`git commit -m "chore: release ${tag}"`, { stdio: 'inherit' });
    } else {
        console.log(yellow('⚠️ No hay cambios pendientes, saltando commit.'));
    }

    // 4. Push a Main
    console.log(`⬆️  Subiendo cambios a ${blue('origin main')}...`);
    execSync('git push origin main', { stdio: 'inherit' });

    // 5. Gestión de Tags (Local y Remotos)
    console.log(`🏷️  Gestionando etiquetas Git...`);

    // Borrar tag local si existe
    try {
        execSync(`git tag -d ${tag}`, { stdio: 'ignore' });
    } catch (e) { }

    // Borrar tags remotos para permitir sobreescribir (re-release)
    try {
        console.log(`🗑️  Limpiando tags viejos en remotos...`);
        execSync(`git push origin :refs/tags/${tag}`, { stdio: 'ignore' });
        execSync(`git push public :refs/tags/${tag}`, { stdio: 'ignore' });
    } catch (e) { }

    // Crear y subir nuevo tag
    console.log(`✨ Creando nuevo tag ${green(tag)}...`);
    execSync(`git tag ${tag}`, { stdio: 'inherit' });

    console.log(`⬆️  Subiendo tag a ${blue('origin')} (privado)...`);
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });

    console.log(`⬆️  Subiendo tag a ${blue('public')} (HoloStack)...`);
    execSync(`git push public ${tag}`, { stdio: 'inherit' });

    console.log(`\n${green('🎉 ¡Lanzamiento completado con éxito!')}`);
    console.log(`🔗 Verifica el repo público: ${blue('https://github.com/SergioXp/HoloStack/releases')}`);
    console.log(`🐳 La imagen Docker se está procesando en Hub.\n`);

} catch (error) {
    console.error(`\n❌ ${red('Error durante el proceso:')}`);
    console.error(error.message);
    process.exit(1);
}
