import { describe, it, expect } from 'vitest';
import { cleanNameForSpecies } from './pokemon-utils';

describe('cleanNameForSpecies', () => {
    it('debe limpiar variantes básicas de TCG', () => {
        expect(cleanNameForSpecies('Pikachu VMAX')).toBe('pikachu');
        expect(cleanNameForSpecies('Charizard ex')).toBe('charizard');
        expect(cleanNameForSpecies('Mewtwo GX')).toBe('mewtwo');
        expect(cleanNameForSpecies('Greninja BREAK')).toBe('greninja');
    });

    it('debe manejar estilos de combate y máscaras', () => {
        expect(cleanNameForSpecies('Rapid Strike Urshifu')).toBe('urshifu');
        expect(cleanNameForSpecies('Teal Mask Ogerpon')).toBe('ogerpon');
        expect(cleanNameForSpecies('Bloodmoon Ursaluna')).toBe('ursaluna');
    });

    it('debe normalizar caracteres especiales y géneros', () => {
        expect(cleanNameForSpecies('Nidoran♂')).toBe('nidoran-m');
        expect(cleanNameForSpecies('Nidoran♀')).toBe('nidoran-f');
        expect(cleanNameForSpecies('Flabébé')).toBe('flabebe');
        expect(cleanNameForSpecies("Farfetch'd")).toBe('farfetchd');
    });

    it('debe manejar nombres con puntos como Mr. Mime', () => {
        expect(cleanNameForSpecies('Mr. Mime')).toBe('mr-mime');
        expect(cleanNameForSpecies('Mr. Rime')).toBe('mr-rime');
    });

    it('debe manejar prefijos regionales', () => {
        expect(cleanNameForSpecies('Galarian Rapidash')).toBe('rapidash');
        expect(cleanNameForSpecies('Alolan Vulpix')).toBe('vulpix');
    });

    it('debe manejar Tag Teams', () => {
        expect(cleanNameForSpecies('Pikachu & Zekrom GX')).toBe('pikachu');
    });
});
