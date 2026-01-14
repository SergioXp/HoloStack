
import { describe, it, expect } from "vitest";
import { parseProxyList, formatAttackCost } from "./proxy-utils";

describe("Proxy Utils", () => {
    describe("parseProxyList", () => {
        it("should handle null and undefined", () => {
            expect(parseProxyList(null)).toEqual([]);
            expect(parseProxyList(undefined)).toEqual([]);
        });

        it("should return same array if already an array", () => {
            const arr = ["item1", "item2"];
            expect(parseProxyList(arr)).toEqual(arr);
        });

        it("should parse JSON array strings", () => {
            const json = '["Energy", "Pokemon"]';
            expect(parseProxyList(json)).toEqual(["Energy", "Pokemon"]);
        });

        it("should handle comma-separated strings", () => {
            expect(parseProxyList("Fire, Water")).toEqual(["Fire", "Water"]);
        });

        it("should wrap single strings/objects in an array", () => {
            expect(parseProxyList("JustOne")).toEqual(["JustOne"]);
            expect(parseProxyList({ name: "Obj" })).toEqual([{ name: "Obj" }]);
        });

        it("should handle empty strings", () => {
            expect(parseProxyList("  ")).toEqual([]);
        });
    });

    describe("formatAttackCost", () => {
        it("should format string array into shorthand icons", () => {
            expect(formatAttackCost(["Fire", "Colorless"])).toBe("[FC]");
            expect(formatAttackCost(["Grass", "Grass", "Colorless"])).toBe("[GGC]");
        });

        it("should return empty string for null/empty", () => {
            expect(formatAttackCost([])).toBe("");
            expect(formatAttackCost(null as any)).toBe("");
        });
    });
});
