import { expect, test, describe } from "vitest";
import { getVariantCount, getTotalOwned, OwnershipData } from "./collection-utils";

describe("Collection Utils", () => {
    const mockData: OwnershipData = {
        "card-1": {
            "normal": { quantity: 2, id: "item-1" },
            "holofoil": { quantity: 1, id: "item-2" }
        },
        "card-2": {
            "reverseHolofoil": { quantity: 4, id: "item-3" }
        }
    };

    describe("getVariantCount", () => {
        test("debería devolver la cantidad correcta para una variante existente", () => {
            expect(getVariantCount(mockData, "card-1", "normal")).toBe(2);
            expect(getVariantCount(mockData, "card-1", "holofoil")).toBe(1);
        });

        test("debería devolver 0 si la carta existe pero la variante no", () => {
            expect(getVariantCount(mockData, "card-1", "reverseHolofoil")).toBe(0);
        });

        test("debería devolver 0 si la carta no existe", () => {
            expect(getVariantCount(mockData, "card-999", "normal")).toBe(0);
        });
    });

    describe("getTotalOwned", () => {
        test("debería sumar todas las variantes de una carta", () => {
            expect(getTotalOwned(mockData, "card-1")).toBe(3); // 2 normal + 1 holo
        });

        test("debería devolver 0 si no hay carta", () => {
            expect(getTotalOwned(mockData, "card-999")).toBe(0);
        });

        test("debería devolver la cantidad de la única variante si solo tiene una", () => {
            expect(getTotalOwned(mockData, "card-2")).toBe(4);
        });
    });
});
