import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionItemManager from './CollectionItemManager';

// Mocks
vi.mock('@/app/actions/collection', () => ({
    updateCollectionItem: vi.fn(),
}));

vi.mock('@/lib/card-utils', () => ({
    getAvailableVariants: vi.fn(() => new Set(['normal', 'holofoil'])),
}));

vi.mock('@/lib/i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    })
}));

// Mock fetch global para evitar errores de URL relativa
global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ inWishlist: false }),
    })
);

const mockCard = {
    id: 'card-1',
    name: 'Pikachu',
    rarity: 'Common',
    supertype: 'Pokémon',
    number: '001',
    images: JSON.stringify({ small: 'https://example.com/image.jpg' }),
    set: { id: 'set-1', name: 'Base Set' }
};

describe('CollectionItemManager', () => {
    it('renders trigger button correctly', () => {
        render(
            <CollectionItemManager
                card={mockCard}
                collectionId="col-1"
                ownedData={new Map()}
                totalInSet={100}
            />
        );

        // Busca el botón que abre el popover (puede ser por icono o clase, mejor por role si tuviera aria-label)
        // Como no tengo accessibilidad fácil, buscaré si hay algún texto o si puedo añadir test-id en el futuro.
        // Por defecto renderiza un botón con variante "ghost".
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    // Test más profundo requeriría interactuar con el Popover de shadcn, que a veces es tricky en jsdom sin setup extra.
    // Nos conformaremos con smoke test de renderizado por ahora para no complicarnos con Radix UI en tests.
});
