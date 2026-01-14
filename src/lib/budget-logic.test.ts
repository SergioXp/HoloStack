
import { describe, it, expect } from "vitest";
import { calculateMonthlyBudgetHistory, BudgetMetadata, ExpenseRecord } from "./budget-logic";

describe("Budget Logic - Carry Over & Monthly History", () => {
    const referenceDate = new Date(2026, 2, 15); // March 15, 2026

    it("should calculate correct carry-over for monthly budget", () => {
        const budget: BudgetMetadata = {
            id: "b1",
            amount: 100,
            period: "monthly",
            startDate: "2026-01-01"
        };
        const expenses: ExpenseRecord[] = [
            { id: "e1", amount: 40, date: "2026-01-10" }, // Jan: 100 - 40 = 60 surplus
            { id: "e2", amount: 150, date: "2026-02-05" } // Feb: 100 + 60 (carry) - 150 = 10 surplus
        ];

        const history = calculateMonthlyBudgetHistory(budget, expenses, referenceDate);

        // Month order: Jan, Feb, Mar (reference)
        expect(history).toHaveLength(3);

        // January
        const jan = history.find(h => h.month === "2026-01");
        expect(jan?.carryOver).toBe(0);
        expect(jan?.totalSpent).toBe(40);
        expect(jan?.available).toBe(60);

        // February
        const feb = history.find(h => h.month === "2026-02");
        expect(feb?.carryOver).toBe(60);
        expect(feb?.totalSpent).toBe(150);
        expect(feb?.available).toBe(10);

        // March
        const mar = history.find(h => h.month === "2026-03");
        expect(mar?.carryOver).toBe(10);
        expect(mar?.available).toBe(110); // 100 + 10
    });

    it("should handle one-time budgets (limit only applied in first month)", () => {
        const budget: BudgetMetadata = {
            id: "b2",
            amount: 500,
            period: "one-time",
            startDate: "2026-01-01"
        };
        const expenses: ExpenseRecord[] = [
            { id: "e1", amount: 100, date: "2026-01-15" },
            { id: "e2", amount: 50, date: "2026-02-10" }
        ];

        const history = calculateMonthlyBudgetHistory(budget, expenses, referenceDate);

        const jan = history.find(h => h.month === "2026-01");
        expect(jan?.budgetAmount).toBe(500);
        expect(jan?.available).toBe(400);

        const feb = history.find(h => h.month === "2026-02");
        expect(feb?.budgetAmount).toBe(0); // No new budget added
        expect(feb?.carryOver).toBe(400);
        expect(feb?.available).toBe(350);
    });

    it("should handle yearly budgets (amount divided by 12)", () => {
        const budget: BudgetMetadata = {
            id: "b3",
            amount: 1200,
            period: "yearly",
            startDate: "2026-01-01"
        };

        const history = calculateMonthlyBudgetHistory(budget, [], referenceDate);

        const jan = history.find(h => h.month === "2026-01");
        expect(jan?.budgetAmount).toBe(100); // 1200 / 12
    });

    it("should fill missing months between start and reference", () => {
        const budget: BudgetMetadata = {
            id: "b4",
            amount: 100,
            period: "monthly",
            startDate: "2026-01-01"
        };
        // No expenses in February
        const expenses: ExpenseRecord[] = [
            { id: "e1", amount: 50, date: "2026-01-01" }
        ];

        const history = calculateMonthlyBudgetHistory(budget, expenses, referenceDate);

        expect(history.map(h => h.month)).toEqual(["2026-01", "2026-02", "2026-03"]);

        const feb = history.find(h => h.month === "2026-02");
        expect(feb?.carryOver).toBe(50);
        expect(feb?.totalSpent).toBe(0);
        expect(feb?.available).toBe(150);
    });
});
