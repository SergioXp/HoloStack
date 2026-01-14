
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriceChart from './PriceChart';
import React from 'react';

// Mock I18n
vi.mock('@/lib/i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
        locale: 'en-US'
    }),
}));

// Mock Recharts to avoid complex SVG rendering in JSDOM
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    LineChart: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Area: () => null,
}));

describe('PriceChart', () => {
    it('renders "no history" state if data is empty', () => {
        render(<PriceChart data={[]} />);
        expect(screen.getByText('cardDetail.noHistory')).toBeInTheDocument();
    });

    it('calculates and displays current price and percentage change (Positive Trend)', () => {
        const mockData = [
            { date: '2023-01-01', marketPrice: 10, source: 'test' },
            { date: '2023-01-02', marketPrice: 15, source: 'test' } // +50%
        ];

        render(<PriceChart data={mockData} />);

        // Current Price
        expect(screen.getByText('$15.00')).toBeInTheDocument();

        // Percent Change (10 -> 15 = 50%)
        expect(screen.getByText('+50.0%')).toBeInTheDocument();

        // Positive color check (Green)
        // We look for the span containing the percentage
        const percentSpan = screen.getByText('+50.0%');
        expect(percentSpan.className).toContain('text-green-400');
    });

    it('calculates and displays current price and percentage change (Negative Trend)', () => {
        const mockData = [
            { date: '2023-01-01', marketPrice: 100, source: 'test' },
            { date: '2023-01-02', marketPrice: 80, source: 'test' } // -20%
        ];

        render(<PriceChart data={mockData} />);

        // Percen tChange (100 -> 80 = -20%)
        expect(screen.getByText('-20.0%')).toBeInTheDocument();

        // Negative color check (Red)
        const percentSpan = screen.getByText('-20.0%');
        expect(percentSpan.className).toContain('text-red-400');
    });

    it('displays min and max stats', () => {
        const mockData = [
            { date: '2023-01-01', marketPrice: 50, source: 'test' },
            { date: '2023-01-02', marketPrice: 100, source: 'test' },
            { date: '2023-01-03', marketPrice: 20, source: 'test' }
        ];

        render(<PriceChart data={mockData} />);

        // Min: 20, Max: 100
        expect(screen.getByText(/cardDetail.min.*\$20.00/)).toBeInTheDocument();
        expect(screen.getByText(/cardDetail.max.*\$100.00/)).toBeInTheDocument();
    });
});
