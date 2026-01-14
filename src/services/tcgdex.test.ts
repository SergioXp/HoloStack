
import { describe, it, expect } from "vitest";
import { transformCardToSchema, TCGdexCard } from "./tcgdex";

describe("TCGdex Service", () => {
    describe("transformCardToSchema", () => {
        // 1. Standard Pokémon Card
        it("should correctly transform a standard Pokémon card", () => {
            const mockCard: TCGdexCard = {
                id: "swsh1-1",
                localId: "1",
                name: "Celebi V",
                image: "https://assets.tcgdex.net/en/swsh/swsh1/1",
                category: "Pokémon",
                illustrator: "PLANETA Mochizuki",
                rarity: "Jumbo Rare",
                hp: 180,
                types: ["Grass"],
                stage: "Basic",
                attacks: [
                    { name: "Leaf Step", cost: ["Grass"], damage: 50 },
                ],
                weaknesses: [{ type: "Fire", value: "x2" }],
                retreat: 1,
                set: {
                    id: "swsh1",
                    name: "Sword & Shield Base Set"
                },
                pricing: {
                    cardmarket: {
                        updated: "2023-01-01",
                        unit: "EUR",
                        trend: 1.50
                    },
                    tcgplayer: {
                        updated: "2023-01-01",
                        unit: "USD",
                        normal: { marketPrice: 1.20 }
                    }
                }
            };

            const result = transformCardToSchema(mockCard);

            expect(result.id).toBe("swsh1-1");
            expect(result.name).toBe("Celebi V");
            expect(result.supertype).toBe("Pokémon");
            expect(result.subtypes).toBe('["Basic"]'); // JSON stringified
            expect(result.hp).toBe("180");
            expect(result.types).toBe('["Grass"]');
            expect(result.retreatCost).toBe('["Colorless"]'); // 1 retreat -> 1 colorless
            expect(result.images).toContain("swsh1/1/low.webp");
            
            // Pricing checks
            const cmPrices = JSON.parse(result.cardmarketPrices as string);
            expect(cmPrices.trend).toBe(1.50);
            
            const tcgPrices = JSON.parse(result.tcgplayerPrices as string);
            expect(tcgPrices.normal.marketPrice).toBe(1.20);
        });

        // 2. Trainer Card
        it("should correctly transform a Trainer card", () => {
            const mockTrainer: TCGdexCard = {
                id: "swsh1-180",
                localId: "180",
                name: "Professor's Research",
                category: "Trainer",
                image: "https://assets.tcgdex.net/en/swsh/swsh1/180",
                rarity: "Rare Holo",
                set: { id: "swsh1", name: "Sword & Shield" },
                pricing: {}
            };

            const result = transformCardToSchema(mockTrainer);

            expect(result.supertype).toBe("Trainer");
            expect(result.hp).toBeNull();
            expect(result.types).toBe("[]");
            expect(result.attacks).toBeNull();
            expect(result.tcgplayerPrices).toBe("{}");
        });

        // 3. Edge Case: No Pricing Data
        it("should handle missing pricing object gracefully", () => {
            const mockCard: TCGdexCard = {
                id: "base1-1",
                localId: "1",
                name: "Alakazam",
                category: "Pokémon",
                set: { id: "base1", name: "Base" },
                // pricing is undefined
            };

            const result = transformCardToSchema(mockCard);

            expect(result.tcgplayerPrices).toBe("{}");
            expect(result.cardmarketPrices).toBe("{}");
        });

        // 4. Edge Case: No Image
        it("should handle cards without images", () => {
             const mockCard: TCGdexCard = {
                id: "promos-1",
                localId: "1",
                name: "Pikachu",
                category: "Pokémon",
                set: { id: "promos", name: "Promos" },
                image: undefined // No image
            };

            const result = transformCardToSchema(mockCard);
            const images = JSON.parse(result.images as string);

            expect(images.small).toBeNull();
            expect(images.large).toBeNull();
        });

        // 5. Retreat Cost Calculation
        it("should convert retreat count to array of Colorless", () => {
             const mockCard: TCGdexCard = {
                id: "test-1",
                localId: "1",
                name: "Snorlax",
                category: "Pokémon",
                set: { id: "test", name: "Test" },
                retreat: 4 // Heavy boy
            };

            const result = transformCardToSchema(mockCard);
            const retreatCost = JSON.parse(result.retreatCost as string);

            expect(retreatCost).toHaveLength(4);
            expect(retreatCost).toEqual(["Colorless", "Colorless", "Colorless", "Colorless"]);
        });
    });
});
