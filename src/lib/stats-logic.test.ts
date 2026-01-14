
import { describe, it, expect } from "vitest";
import { calculateStats, StatItem } from "./stats-logic";

describe("Stats Logic", () => {
    const mockItems: StatItem[] = [
        {
            cardId: "c1",
            cardNumber: "1",
            setId: "s1",
            setName: "Set 1",
            variant: "normal",
            quantity: 2,
            cardName: "Pikachu",
            rarity: "Rare",
            setSeries: "Base",
            tcgplayerPrices: { normal: { marketPrice: 10 } },
            cardmarketPrices: {},
            images: '{"small": "url1"}'
        },
        {
            cardId: "c2",
            cardNumber: "2",
            setId: "s1",
            setName: "Set 1",
            variant: "holofoil",
            quantity: 1,
            cardName: "Charizard",
            rarity: "Super Rare",
            setSeries: "Base",
            tcgplayerPrices: { holofoil: { marketPrice: 100 } },
            cardmarketPrices: {},
            images: '{"small": "url2"}'
        }
    ];

    it("should calculate correct total value and card count", () => {
        const stats = calculateStats(mockItems);
        // (9.2 * 2) + 92 = 110.4
        expect(stats.totalValue).toBe(110.4);
        expect(stats.totalCards).toBe(3);
    });

    it("should aggregate by rarity", () => {
        const stats = calculateStats(mockItems);
        const rare = stats.rarityData.find(r => r.name === "Rare");
        const superRare = stats.rarityData.find(r => r.name === "Super Rare");

        expect(rare?.value).toBe(2);
        expect(superRare?.value).toBe(1);
    });

    it("should aggregate by series", () => {
        const stats = calculateStats(mockItems);
        const baseSeries = stats.seriesData.find(s => s.name === "Base");
        expect(baseSeries?.value).toBe(3);
        expect(stats.uniqueSeries).toBe(1);
    });

    it("should identify top cards by value", () => {
        const stats = calculateStats(mockItems);
        expect(stats.topCards[0].name).toBe("Charizard");
        expect(stats.topCards[0].value).toBe(92);
        expect(stats.topCards[1].name).toBe("Pikachu");
        expect(stats.topCards[1].value).toBe(9.2);
    });

    it("should handle items without prices", () => {
        const itemsNoPrice: StatItem[] = [
            {
                cardId: "c3",
                cardNumber: "3",
                setId: "s2",
                setName: "Empty",
                variant: "normal",
                quantity: 5,
                cardName: "Commoner",
                rarity: "Common",
                setSeries: "Neo",
                tcgplayerPrices: {},
                cardmarketPrices: {},
                images: null
            }
        ];
        const stats = calculateStats(itemsNoPrice);
        expect(stats.totalValue).toBe(0);
        expect(stats.totalCards).toBe(5);
        expect(stats.topCards).toHaveLength(0);
    });
});
