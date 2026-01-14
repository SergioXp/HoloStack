
import { describe, it, expect } from "vitest";
import { filterCardsInMemory, CollectionFilter } from "./sync-logic";
import { TCGdexCard } from "@/services/tcgdex";

describe("Sync Logic - In-Memory Filtering", () => {
    // Mock Data
    const mockCards: TCGdexCard[] = [
        {
            id: "base1-25",
            localId: "25",
            name: "Pikachu",
            category: "Pokémon",
            rarity: "Common",
            set: { id: "base1", name: "Base Set" }
        },
        {
            id: "base1-26",
            localId: "26",
            name: "Raichu",
            category: "Pokémon",
            rarity: "Rare Holo",
            set: { id: "base1", name: "Base Set" }
        },
        {
            id: "swsh1-1",
            localId: "1",
            name: "Celebi V",
            category: "Pokémon",
            rarity: "Double Rare",
            set: { id: "swsh1", name: "Sword & Shield" }
        },
        {
            id: "swsh4-185",
            localId: "185",
            name: "Pikachu VMAX",
            category: "Pokémon",
            rarity: "Ultra Rare",
            set: { id: "swsh4", name: "Vivid Voltage" }
        },
        {
            id: "base1-90",
            localId: "90",
            name: "Professor Oak",
            category: "Trainer",
            rarity: "Rare",
            set: { id: "base1", name: "Base Set" }
        }
    ];

    it("should return all cards if no filters are provided", () => {
        const result = filterCardsInMemory(mockCards, {});
        expect(result).toHaveLength(5);
    });

    it("should filter by single name (case insensitive)", () => {
        const result = filterCardsInMemory(mockCards, { name: "pikachu" });
        expect(result).toHaveLength(2); // Pikachu, Pikachu VMAX
        expect(result.map(c => c.name)).toContain("Pikachu");
        expect(result.map(c => c.name)).toContain("Pikachu VMAX");
    });

    it("should filter by array of names", () => {
        const result = filterCardsInMemory(mockCards, { names: ["Raichu", "Oak"] });
        expect(result).toHaveLength(2); // Raichu, Professor Oak
    });

    it("should filter by rarity (fuzzy match)", () => {
        // "Rare" should match "Rare", "Rare Holo", "Double Rare", "Ultra Rare"
        const result = filterCardsInMemory(mockCards, { rarity: "Rare" });
        // Cards with "Rare" in string: Raichu (Rare Holo), Celebi V (Double Rare), 
        // Pikachu VMAX (Ultra Rare), Professor Oak (Rare).
        // Does Pikachu (Common) match? No.
        expect(result).toHaveLength(4);
    });

    it("should filter by specific rarity array", () => {
        const result = filterCardsInMemory(mockCards, { rarity: ["Common", "Ultra Rare"] });
        expect(result).toHaveLength(2); // Pikachu, Pikachu VMAX
    });

    it("should filter by supertype", () => {
        const result = filterCardsInMemory(mockCards, { supertype: "Trainer" });
        expect(result).toHaveLength(1); // Professor Oak
    });

    it("should combined filters (AND logic)", () => {
        // Pokemon named "Pikachu" that is also "Ultra Rare"
        const result = filterCardsInMemory(mockCards, {
            name: "Pikachu",
            rarity: "Ultra Rare"
        });
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Pikachu VMAX");
    });

    it("should return empty if no overlap", () => {
        // "Pikachu" that is a "Trainer"
        const result = filterCardsInMemory(mockCards, {
            name: "Pikachu",
            supertype: "Trainer"
        });
        expect(result).toHaveLength(0);
    });
});
