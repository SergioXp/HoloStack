
import { describe, it, expect } from "vitest";
import { isPriceStale } from "./date-utils";

describe("Date Utils - Price Freshness", () => {
    const now = new Date("2026-01-15T12:00:00Z");

    it("should consider null or undefined dates as stale", () => {
        expect(isPriceStale(null, now)).toBe(true);
        expect(isPriceStale(undefined as any, now)).toBe(true);
    });

    it("should consider invalid date strings as stale", () => {
        expect(isPriceStale("not-a-date", now)).toBe(true);
    });

    it("should detect stale prices (more than 24h old)", () => {
        const yesterday = new Date("2026-01-14T11:59:00Z"); // 24h 1min ago
        expect(isPriceStale(yesterday, now)).toBe(true);
    });

    it("should consider fresh prices (less than 24h old)", () => {
        const today = new Date("2026-01-14T12:01:00Z"); // 23h 59min ago
        expect(isPriceStale(today, now)).toBe(false);
    });

    it("should handle ISO date strings correctly", () => {
        const freshISO = "2026-01-15T10:00:00Z";
        expect(isPriceStale(freshISO, now)).toBe(false);

        const staleISO = "2026-01-14T01:00:00Z";
        expect(isPriceStale(staleISO, now)).toBe(true);
    });
});
