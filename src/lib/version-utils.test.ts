import { describe, it, expect } from 'vitest';
import { hasNewerVersion, sortVersionTags } from './version-utils';

describe('Version Comparison Logic', () => {
    describe('hasNewerVersion', () => {
        it('debe detectar versión mayor en patch', () => {
            expect(hasNewerVersion('0.8.2', '0.8.3')).toBe(true);
        });

        it('debe detectar versión mayor en minor', () => {
            expect(hasNewerVersion('0.8.3', '0.9.0')).toBe(true);
        });

        it('debe detectar versión mayor en major', () => {
            expect(hasNewerVersion('0.9.9', '1.0.0')).toBe(true);
        });

        it('debe devolver false si son iguales', () => {
            expect(hasNewerVersion('0.8.3', '0.8.3')).toBe(false);
        });

        it('debe devolver false si remote es menor', () => {
            expect(hasNewerVersion('1.0.0', '0.9.9')).toBe(false);
        });

        it('debe manejar prefijo v', () => {
            expect(hasNewerVersion('0.8.2', 'v0.8.3')).toBe(true);
            expect(hasNewerVersion('v0.8.2', '0.8.3')).toBe(true);
        });
    });

    describe('sortVersionTags', () => {
        it('debe ordenar versiones de mayor a menor', () => {
            const tags = ['0.7.0', '0.8.3', '0.8.1', '1.0.0', '0.9.0'];
            expect(sortVersionTags(tags)).toEqual(['1.0.0', '0.9.0', '0.8.3', '0.8.1', '0.7.0']);
        });

        it('debe filtrar tags no semánticos', () => {
            const tags = ['latest', '0.8.3', 'dev', '0.8.2', 'main'];
            expect(sortVersionTags(tags)).toEqual(['0.8.3', '0.8.2']);
        });

        it('debe manejar prefijo v', () => {
            const tags = ['v1.0.0', '0.9.0', 'v0.8.0'];
            expect(sortVersionTags(tags)).toEqual(['v1.0.0', '0.9.0', 'v0.8.0']);
        });
    });
});
