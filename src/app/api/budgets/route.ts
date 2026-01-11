import { db } from "@/db";
import { budgets, budgetGroups, expenses, collections } from "@/db/schema";
import { eq, sql, and, gte, lte, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// GET - Listar todos los presupuestos con stats
export async function GET() {
    try {
        // Obtener todos los presupuestos
        const allBudgets = await db.select().from(budgets);

        // Calcular gastos por presupuesto para el mes actual
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

        // Para cada presupuesto, calcular el gasto total
        const budgetsWithStats = await Promise.all(
            allBudgets.map(async (budget) => {
                // Calcular gastos del período actual
                let totalSpent = 0;

                if (budget.period === "monthly") {
                    const expensesResult = await db
                        .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
                        .from(expenses)
                        .where(
                            and(
                                eq(expenses.budgetId, budget.id),
                                gte(expenses.date, startOfMonth),
                                lte(expenses.date, endOfMonth)
                            )
                        );
                    totalSpent = expensesResult[0]?.total || 0;
                } else if (budget.period === "yearly") {
                    const startOfYear = `${now.getFullYear()}-01-01`;
                    const endOfYear = `${now.getFullYear()}-12-31`;
                    const expensesResult = await db
                        .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
                        .from(expenses)
                        .where(
                            and(
                                eq(expenses.budgetId, budget.id),
                                gte(expenses.date, startOfYear),
                                lte(expenses.date, endOfYear)
                            )
                        );
                    totalSpent = expensesResult[0]?.total || 0;
                } else {
                    // one-time: todos los gastos
                    const expensesResult = await db
                        .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
                        .from(expenses)
                        .where(eq(expenses.budgetId, budget.id));
                    totalSpent = expensesResult[0]?.total || 0;
                }

                // Obtener nombre de colección si aplica
                let collectionName = null;
                if (budget.collectionId) {
                    const collection = await db.query.collections.findFirst({
                        where: eq(collections.id, budget.collectionId),
                    });
                    collectionName = collection?.name || null;
                }

                // Calcular porcentaje
                const percentage = budget.amount > 0 ? Math.round((totalSpent / budget.amount) * 100) : 0;

                return {
                    ...budget,
                    totalSpent,
                    remaining: budget.amount - totalSpent,
                    percentage,
                    collectionName,
                };
            })
        );

        return Response.json(budgetsWithStats);
    } catch (error) {
        console.error("Error fetching budgets:", error);
        return Response.json({ error: "Error obteniendo presupuestos" }, { status: 500 });
    }
}

// POST - Crear nuevo presupuesto
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, collectionId, amount, currency, period, startDate, parentBudgetIds } = body;

        if (!name || !type || !amount) {
            return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // Crear presupuesto
        const [newBudget] = await db.insert(budgets).values({
            name,
            type,
            collectionId: type === "collection" ? collectionId : null,
            amount,
            currency: currency || "EUR",
            period: period || "monthly",
            startDate: startDate || new Date().toISOString().split("T")[0],
            isActive: true,
        }).returning();

        // Si se especificaron presupuestos padre, crear las relaciones
        if (parentBudgetIds && Array.isArray(parentBudgetIds) && parentBudgetIds.length > 0) {
            for (const parentId of parentBudgetIds) {
                await db.insert(budgetGroups).values({
                    parentBudgetId: parentId,
                    childBudgetId: newBudget.id,
                });
            }
        }

        revalidatePath("/budgets");

        return Response.json(newBudget);
    } catch (error) {
        console.error("Error creating budget:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
