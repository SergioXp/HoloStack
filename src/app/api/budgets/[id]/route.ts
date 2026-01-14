import { db } from "@/db";
import { budgets, budgetGroups, expenses, collections } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateMonthlyBudgetHistory, type ExpenseRecord } from "@/lib/budget-logic";

// GET - Obtener presupuesto con detalles e historial
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    try {
        const budget = await db.query.budgets.findFirst({
            where: eq(budgets.id, id),
        });

        if (!budget) {
            return Response.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        // Obtener TODOS los gastos del presupuesto, ordenados por fecha
        const allExpenses = await db
            .select()
            .from(expenses)
            .where(eq(expenses.budgetId, id))
            .orderBy(asc(expenses.date));

        // Calcular histórico usando la lógica extraída
        const monthlyHistory = calculateMonthlyBudgetHistory(
            {
                id: budget.id,
                amount: budget.amount,
                period: budget.period,
                startDate: budget.startDate
            },
            allExpenses as ExpenseRecord[]
        );

        // Datos del mes actual
        const currentMonthData = monthlyHistory.find(m => m.month === currentMonth) || monthlyHistory[0];

        // Nombre de colección si aplica
        let collectionName = null;
        if (budget.collectionId) {
            const collection = await db.query.collections.findFirst({
                where: eq(collections.id, budget.collectionId),
            });
            collectionName = collection?.name || null;
        }

        // Obtener hijos si es presupuesto global
        const childLinks = await db.select().from(budgetGroups).where(eq(budgetGroups.parentBudgetId, id));
        let children: any[] = [];
        if (childLinks.length > 0) {
            const childIds = childLinks.map((l) => l.childBudgetId);
            children = await db.select().from(budgets).where(
                sql`${budgets.id} IN (${sql.join(childIds.map((cid) => sql`${cid}`), sql`, `)})`
            );
        }

        // Estadísticas totales
        const totalSpentAllTime = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenseCount = allExpenses.length;

        return Response.json({
            ...budget,
            // Datos del mes actual
            currentMonth: currentMonthData?.month || currentMonth,
            totalSpent: currentMonthData?.totalSpent || 0,
            remaining: currentMonthData?.available || budget.amount,
            carryOver: currentMonthData?.carryOver || 0,
            percentage: currentMonthData
                ? Math.round((currentMonthData.totalSpent / (currentMonthData.budgetAmount + Math.max(0, currentMonthData.carryOver))) * 100)
                : 0,
            // Gastos del mes actual
            expenses: currentMonthData?.expenses || [],
            expenseCount: currentMonthData?.expenses.length || 0,
            // Histórico por meses (más recientes primero)
            monthlyHistory: [...monthlyHistory].reverse(),
            // Estadísticas globales
            totalSpentAllTime,
            totalExpenseCount,
            // Relaciones
            collectionName,
            children,
        });
    } catch (error) {
        console.error("Error fetching budget:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PUT - Actualizar presupuesto
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        const existing = await db.query.budgets.findFirst({
            where: eq(budgets.id, id),
        });

        if (!existing) {
            return Response.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.amount !== undefined) updateData.amount = body.amount;
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.period !== undefined) updateData.period = body.period;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.collectionId !== undefined) updateData.collectionId = body.collectionId;

        const [updated] = await db.update(budgets)
            .set(updateData)
            .where(eq(budgets.id, id))
            .returning();

        revalidatePath(`/budgets/${id}`);
        revalidatePath("/budgets");

        return Response.json(updated);
    } catch (error) {
        console.error("Error updating budget:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE - Eliminar presupuesto
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Eliminar relaciones de grupo
        await db.delete(budgetGroups).where(eq(budgetGroups.parentBudgetId, id));
        await db.delete(budgetGroups).where(eq(budgetGroups.childBudgetId, id));

        // Eliminar gastos asociados
        await db.delete(expenses).where(eq(expenses.budgetId, id));

        // Eliminar presupuesto
        await db.delete(budgets).where(eq(budgets.id, id));

        revalidatePath("/budgets");

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
