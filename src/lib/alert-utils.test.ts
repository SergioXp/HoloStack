
import { describe, it, expect } from "vitest";
import { isPriceDropSignificant, formatPriceChange } from "./alert-utils";

describe("Alert Utils - Price Drops", () => {
    describe("isPriceDropSignificant", () => {
        it("should detect drop above default threshold (10%)", () => {
            expect(isPriceDropSignificant(100, 89)).toBe(true); // 11% drop
            expect(isPriceDropSignificant(100, 91)).toBe(false); // 9% drop
        });

        it("should respect custom threshold", () => {
            expect(isPriceDropSignificant(100, 95, 2)).toBe(true); // 5% drop > 2% threshold
            expect(isPriceDropSignificant(100, 99, 5)).toBe(false); // 1% drop < 5% threshold
        });

        it("should return false for price increases", () => {
            expect(isPriceDropSignificant(100, 110)).toBe(false);
        });

        it("should handle zero or negative prices gracefully", () => {
            expect(isPriceDropSignificant(0, 10)).toBe(false);
            expect(isPriceDropSignificant(10, 0)).toBe(false);
        });
    });

    describe("formatPriceChange", () => {
        it("should calculate correct difference and percentage", () => {
            const res = formatPriceChange(10, 15);
            expect(res.diff).toBe(5);
            expect(res.percent).toBe(50);
            expect(res.isDrop).toBe(false);

            const res2 = formatPriceChange(20, 15);
            expect(res2.diff).toBe(-5);
            expect(res2.percent).toBe(-25);
            expect(res2.isDrop).toBe(true);
        });
    });
});
