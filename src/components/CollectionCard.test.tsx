
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollectionCard from './CollectionCard';
import React from 'react';

// Mock hook useI18n
vi.mock('@/lib/i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key === "common.noImage" ? "No Image" : key,
    }),
}));

// Mock Next/Image (since it's tricky in jsdom sometimes)
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} alt={props.alt} />
}));

describe('CollectionCard', () => {
    const mockCard = {
        name: 'Pikachu',
        number: '025',
        images: JSON.stringify({ small: '/pikachu.png' }),
    };

    it('renders card name and number', () => {
        render(<CollectionCard card={mockCard} ownedQuantity={0} totalInSet={151} />);

        expect(screen.getByText('Pikachu')).toBeInTheDocument();
        expect(screen.getByText('025/151')).toBeInTheDocument();
    });

    it('renders in "grayscale" mode if not owned (quantity 0)', () => {
        const { container } = render(<CollectionCard card={mockCard} ownedQuantity={0} totalInSet={151} />);

        // Check for grayscale class in the card wrapper
        // The first Child of the container is the Card div.
        // We can inspect the classList.
        // In the code: !isOwned ? "grayscale..."
        const cardElement = container.firstChild as HTMLElement;
        expect(cardElement.className).toContain('grayscale');
        expect(cardElement.className).toContain('opacity-60');
    });

    it('renders "colored" and with quantity badge if owned (quantity > 0)', () => {
        render(<CollectionCard card={mockCard} ownedQuantity={2} totalInSet={151} />);

        // Badge should be visible showing "2"
        expect(screen.getByText('2')).toBeInTheDocument();

        // Should NOT have grayscale
        const cardElement = screen.getByText('Pikachu').closest('.border-slate-800');
        // Note: finding by text finds the span inside. closest usually works if structure allows, 
        // or loop up. 
        // Better to use testid if we could edit the component, but we can rely on containment or re-query.
        expect(cardElement).not.toHaveClass('grayscale');
    });

    it('renders fallback text if no image', () => {
        const cardNoImage = { ...mockCard, images: null };
        render(<CollectionCard card={cardNoImage} ownedQuantity={0} totalInSet={151} />);

        expect(screen.getByText('No Image')).toBeInTheDocument();
    });
});
