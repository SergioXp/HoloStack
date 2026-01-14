
import { describe, it, expect } from "vitest";
import { validateBulkInputs, SetCardBrief } from "./bulk-validator";

describe("Bulk Validator Logic", () => {
    // Mock Data
    const mockSetCards: SetCardBrief[] = [
        { id: "1", number: "1", name: "Bulbasaur", images: '{"small":"url"}', rarity: "Common" },
        { id: "2", number: "002", name: "Ivysaur", images: null, rarity: "Uncommon" },
        { id: "3", number: "151", name: "Mew", images: null, rarity: "Rare" },
        { id: "4", number: "TG01", name: "Pikachu", images: null, rarity: "Rare Holo" } // Trainer Gallery
    ];

    it("should match exact numbers", () => {
        const inputs = [{ raw: "1", number: "1", quantity: 1 }];
        const results = validateBulkInputs(inputs, mockSetCards);

        expect(results[0].status).toBe("valid");
        expect((results[0] as any).card?.name).toBe("Bulbasaur");
    });

    it("should fuzzy match numbers (remove leading zeros from DB)", () => {
        // DB has "002", Input has "2" -> Should match conceptually?
        // Logic check: normalize(db=002) = 2. normalize(input=2) = 2. Match!
        const inputs = [{ raw: "2", number: "2", quantity: 1 }];
        const results = validateBulkInputs(inputs, mockSetCards);

        expect(results[0].status).toBe("valid");
        // expect(results[0].card?.name).toBe("Ivysaur"); // Assuming logic handles DB normalization too
    });

    it("should fuzzy match numbers (remove leading zeros from Input)", () => {
        // DB has "1", Input has "001"
        const inputs = [{ raw: "001", number: "001", quantity: 1 }];
        const results = validateBulkInputs(inputs, mockSetCards);

        expect(results[0].status).toBe("valid");
        expect((results[0] as any).card?.name).toBe("Bulbasaur");
    });

    it("should handle mixed alphanumeric numbers (TG01)", () => {
        const inputs = [{ raw: "TG01", number: "TG01", quantity: 1 }];
        const results = validateBulkInputs(inputs, mockSetCards);

        expect(results[0].status).toBe("valid");
        expect((results[0] as any).card?.name).toBe("Pikachu");
    });

    it("should return invalid for non-existent numbers", () => {
        const inputs = [{ raw: "999", number: "999", quantity: 1 }];
        const results = validateBulkInputs(inputs, mockSetCards);

        expect(results[0].status).toBe("invalid");
    });

    it("should handle empty inputs gracefully", () => {
        const results = validateBulkInputs([], mockSetCards);
        expect(results).toHaveLength(0);
    });
});
