import { describe, it, expect } from "vitest";
import {
    convertCurrency,
    formatPrice,
    parseTCGPlayerPrices,
    parseCardmarketPrices,
    getMarketPrice,
    getCardmarketPrice,
    getBestPrice,
    calculateTotalValue,
} from "./prices";

describe("Prices Module", () => {
    describe("convertCurrency", () => {
        it("debería devolver el mismo valor si las monedas son iguales", () => {
            expect(convertCurrency(100, "USD", "USD")).toBe(100);
            expect(convertCurrency(50, "EUR", "EUR")).toBe(50);
        });

        it("debería convertir USD a EUR correctamente", () => {
            const result = convertCurrency(100, "USD", "EUR");
            expect(result).toBe(92); // 100 * 0.92
        });

        it("debería convertir EUR a USD correctamente", () => {
            const result = convertCurrency(100, "EUR", "USD");
            expect(result).toBe(109); // 100 * 1.09
        });
    });

    describe("formatPrice", () => {
        it("debería formatear USD correctamente", () => {
            expect(formatPrice(99.99, "USD")).toBe("$99.99");
        });

        it("debería formatear EUR correctamente", () => {
            const result = formatPrice(99.99, "EUR");
            expect(result).toContain("99,99");
            expect(result).toContain("€");
        });

        it("debería devolver '-' para valores nulos o undefined", () => {
            expect(formatPrice(null, "USD")).toBe("-");
            expect(formatPrice(undefined, "EUR")).toBe("-");
        });
    });

    describe("parseTCGPlayerPrices", () => {
        it("debería parsear JSON válido", () => {
            const json = '{"normal":{"market":5.99},"holofoil":{"market":15.99}}';
            const result = parseTCGPlayerPrices(json);
            expect(result).not.toBeNull();
            expect(result?.normal?.market).toBe(5.99);
            expect(result?.holofoil?.market).toBe(15.99);
        });

        it("debería devolver null para JSON inválido", () => {
            expect(parseTCGPlayerPrices("not json")).toBeNull();
            expect(parseTCGPlayerPrices(null)).toBeNull();
            expect(parseTCGPlayerPrices(undefined)).toBeNull();
        });
    });

    describe("parseCardmarketPrices", () => {
        it("debería parsear JSON válido", () => {
            const json = '{"trendPrice":12.50,"averageSellPrice":11.00}';
            const result = parseCardmarketPrices(json);
            expect(result).not.toBeNull();
            expect(result?.trendPrice).toBe(12.50);
        });

        it("debería devolver null para valores inválidos", () => {
            expect(parseCardmarketPrices(null)).toBeNull();
        });
    });

    describe("getMarketPrice", () => {
        const mockPrices = {
            normal: { market: 5.99, mid: 6.50, low: 4.00 },
            holofoil: { market: 25.00 },
        };

        it("debería obtener el precio de mercado para una variante", () => {
            expect(getMarketPrice(mockPrices, "normal")).toBe(5.99);
            expect(getMarketPrice(mockPrices, "holofoil")).toBe(25.00);
        });

        it("debería hacer fallback a normal si la variante no existe", () => {
            expect(getMarketPrice(mockPrices, "reverseHolofoil")).toBe(5.99);
        });

        it("debería devolver null si no hay precios", () => {
            expect(getMarketPrice(null, "normal")).toBeNull();
        });
    });

    describe("getCardmarketPrice", () => {
        it("debería priorizar trendPrice", () => {
            expect(getCardmarketPrice({ trendPrice: 10, averageSellPrice: 8 })).toBe(10);
        });

        it("debería hacer fallback a averageSellPrice", () => {
            expect(getCardmarketPrice({ averageSellPrice: 8, lowPrice: 5 })).toBe(8);
        });

        it("debería devolver null si no hay datos", () => {
            expect(getCardmarketPrice(null)).toBeNull();
        });
    });

    describe("getBestPrice", () => {
        const tcgJson = '{"normal":{"market":10.00}}';
        const cmJson = '{"trendPrice":9.00}';

        it("debería preferir Cardmarket para EUR", () => {
            const result = getBestPrice(tcgJson, cmJson, "normal", "EUR");
            expect(result?.source).toBe("cardmarket");
            expect(result?.price).toBe(9.00);
        });

        it("debería preferir TCGPlayer para USD", () => {
            const result = getBestPrice(tcgJson, cmJson, "normal", "USD");
            expect(result?.source).toBe("tcgplayer");
            expect(result?.price).toBe(10.00);
        });

        it("debería devolver null si no hay precios", () => {
            expect(getBestPrice(null, null, "normal", "EUR")).toBeNull();
        });
    });

    describe("calculateTotalValue", () => {
        it("debería calcular el valor total correctamente", () => {
            const items = [
                { tcgplayerPrices: '{"normal":{"market":10}}', cardmarketPrices: null, variant: "normal" as const, quantity: 2 },
                { tcgplayerPrices: '{"holofoil":{"market":50}}', cardmarketPrices: null, variant: "holofoil" as const, quantity: 1 },
            ];
            // En USD: (10*2) + (50*1) = 70
            // Convertido a EUR: depende de la lógica, pero debería ser ~64.40
            const result = calculateTotalValue(items, "USD");
            expect(result).toBe(70);
        });

        it("debería devolver 0 para array vacío", () => {
            expect(calculateTotalValue([], "EUR")).toBe(0);
        });
    });
});
