
export interface BudgetMetadata {
    id: string;
    amount: number;
    period: string; // "monthly" | "yearly" | "one-time"
    startDate: string | null;
}

export interface ExpenseRecord {
    id: string;
    amount: number;
    date: string; // "YYYY-MM-DD"
}

export interface MonthData {
    month: string; // "2026-01"
    label: string; // "Enero 2026"
    totalSpent: number;
    budgetAmount: number;
    carryOver: number; // Arrastre del mes anterior
    available: number; // budgetAmount + carryOver - totalSpent
    expenses: ExpenseRecord[];
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/**
 * Calculates the monthly history of a budget with carry-over logic.
 */
export function calculateMonthlyBudgetHistory(
    budget: BudgetMetadata,
    allExpenses: ExpenseRecord[],
    referenceDate: Date = new Date()
): MonthData[] {
    // 1. Group expenses by month
    const expensesByMonth: Record<string, ExpenseRecord[]> = {};
    for (const expense of allExpenses) {
        const month = expense.date.substring(0, 7); // "YYYY-MM"
        if (!expensesByMonth[month]) {
            expensesByMonth[month] = [];
        }
        expensesByMonth[month].push(expense);
    }

    // 2. Find earliest month
    const startDate = budget.startDate ? new Date(budget.startDate) : referenceDate;
    let earliestMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    const monthsWithExpenses = Object.keys(expensesByMonth);
    for (const m of monthsWithExpenses) {
        if (m < earliestMonth) {
            earliestMonth = m;
        }
    }

    // 3. Generate all months until referenceDate
    const [startYear, startMonthNum] = earliestMonth.split("-").map(Number);
    const months: string[] = [];
    const tempDate = new Date(startYear, startMonthNum - 1, 1);

    // Safety break to avoid infinite loops if dates are invalid
    let iterations = 0;
    while (tempDate <= referenceDate && iterations < 1200) { // Max 100 years
        months.push(`${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, "0")}`);
        tempDate.setMonth(tempDate.getMonth() + 1);
        iterations++;
    }

    // 4. Calculate monthly data with carry-over
    const monthlyDataList: MonthData[] = [];
    let carryOver = 0;

    for (const month of months) {
        const [year, mNumStr] = month.split("-");
        const mNum = parseInt(mNumStr);
        const monthExpenses = expensesByMonth[month] || [];
        const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        let monthlyBudgetValue = budget.amount;
        if (budget.period === "yearly") {
            monthlyBudgetValue = budget.amount / 12;
        } else if (budget.period === "one-time") {
            monthlyBudgetValue = month === months[0] ? budget.amount : 0;
        }

        const available = monthlyBudgetValue + carryOver - totalSpent;

        monthlyDataList.push({
            month,
            label: `${monthNames[mNum - 1]} ${year}`,
            totalSpent,
            budgetAmount: monthlyBudgetValue,
            carryOver,
            available,
            expenses: monthExpenses.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
        });

        carryOver = available;
    }

    return monthlyDataList;
}
