/**
 * Compara dos versiones semánticas y devuelve true si remote > current
 */
export function hasNewerVersion(current: string, remote: string): boolean {
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
}

/**
 * Ordena tags de versión de mayor a menor
 */
export function sortVersionTags(tags: string[]): string[] {
    return tags
        .filter(name => /^\d+\.\d+\.\d+$/.test(name) || /^v\d+\.\d+\.\d+$/.test(name) || /^\d{8}-\d{4}$/.test(name))
        .sort((a, b) => {
            const clean = (v: string) => v.replace(/^v/, '').split('.').map(Number);
            const va = clean(a);
            const vb = clean(b);
            for (let i = 0; i < 3; i++) {
                if (va[i] > vb[i]) return -1;
                if (va[i] < vb[i]) return 1;
            }
            return 0;
        });
}
