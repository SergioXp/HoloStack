import { describe, it, expect } from 'vitest';
import { parseCardmarketText } from './cardmarket-parser';

describe('parseCardmarketText', () => {
    it('parses a standard single item line correctly', () => {
        const input = `1x Zacian (Phantasmal Flames) - ART - Español - NM 4,00 EUR`;
        const result = parseCardmarketText(input);

        expect(result.items).toHaveLength(1);
        const item = result.items[0];
        expect(item.quantity).toBe(1);
        expect(item.name).toBe('Zacian');
        expect(item.setName).toBe('Phantasmal Flames');
        expect(item.rarity).toBe('ART'); // Key new feature
        expect(item.language).toBe('Español');
        expect(item.condition).toBe('NM');
        expect(item.price).toBe(4.00);
        expect(item.variant).toBe('normal'); // Default unless verified otherwise
    });

    it('extracts variant from name (Reverse Holo)', () => {
        const input = `1x Pikachu (Reverse Holo) (151) - C - English - NM 1,00 EUR`;
        const result = parseCardmarketText(input);

        expect(result.items[0].name).toBe('Pikachu'); // Cleaned name
        expect(result.items[0].variant).toBe('reverse holo');
    });

    it('identifies rarity codes correctly', () => {
        const input = `
            1x Mega Lopunny ex (Phantasmal Flames) - RR - Español - NM 1,20 EUR
            1x Blowtorch (Phantasmal Flames) - UR - Español - NM 2,20 EUR
            1x Buneary (Phantasmal Flames) - C - Español - NM 0,20 EUR
        `;
        const result = parseCardmarketText(input);

        expect(result.items).toHaveLength(3);
        expect(result.items[0].rarity).toBe('RR');
        expect(result.items[1].rarity).toBe('UR');
        expect(result.items[2].rarity).toBe('C');
    });

    it('parses order metadata (Seller, Order ID, Shipping)', () => {
        const input = `
            Pedido 123456789
            Vendedor: SuperSeller
            Costos de envío 1,50 EUR
        `;
        const result = parseCardmarketText(input);

        expect(result.orderId).toBe('123456789');
        expect(result.seller).toBe('SuperSeller');

        const shipping = result.items.find(i => i.isShipping);
        expect(shipping).toBeDefined();
        expect(shipping?.price).toBe(1.50);
    });

    it('handles total line (ignored but parsed safely)', () => {
        const input = `
            1x Card (Set) - C - EN - NM 1,00 EUR
            Total 1,00 EUR
         `;
        const result = parseCardmarketText(input);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('Card');
    });
});
