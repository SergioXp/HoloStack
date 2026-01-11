import { db } from "@/db";
import { budgets, budgetGroups, expenses, collections } from "@/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface MonthData {
    month: string; // "2026-01"
    label: string; // "Enero 2026"
    totalSpent: number;
    budgetAmount: number;
    carryOver: number; // Arrastre del mes anterior
    available: number; // budgetAmount + carryOver - totalSpent
    expenses: any[];
}

// GET - Obtener presupuesto con detalles e historial
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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

        // Calcular estadísticas del mes actual
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Agrupar gastos por mes
        const expensesByMonth: Record<string, any[]> = {};
        for (const expense of allExpenses) {
            const month = expense.date.substring(0, 7); // "YYYY-MM"
            if (!expensesByMonth[month]) {
                expensesByMonth[month] = [];
            }
            expensesByMonth[month].push(expense);
        }

        // Obtener todos los meses únicos de los gastos
        const monthsWithExpenses = Object.keys(expensesByMonth);

        // Encontrar el mes más antiguo entre: inicio del presupuesto, primer gasto, o mes actual
        const startDate = budget.startDate ? new Date(budget.startDate) : now;
        let earliestMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;

        // Si hay gastos antes del inicio del presupuesto, usar el mes más antiguo de los gastos
        for (const m of monthsWithExpenses) {
            if (m < earliestMonth) {
                earliestMonth = m;
            }
        }

        // Generar todos los meses desde el más antiguo hasta el actual
        const [startYear, startMonthNum] = earliestMonth.split("-").map(Number);
        const months: string[] = [];
        const tempDate = new Date(startYear, startMonthNum - 1, 1);
        while (tempDate <= now) {
            months.push(`${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, "0")}`);
            tempDate.setMonth(tempDate.getMonth() + 1);
        }

        // Calcular datos por mes con carry-over
        const monthlyData: MonthData[] = [];
        let carryOver = 0;

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        for (const month of months) {
            const [year, monthNum] = month.split("-");
            const monthExpenses = expensesByMonth[month] || [];
            const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

            // Para presupuestos mensuales, el amount se aplica cada mes
            // Para anuales, se divide entre 12
            // Para únicos, solo hay un amount total
            let monthlyBudget = budget.amount;
            if (budget.period === "yearly") {
                monthlyBudget = budget.amount / 12;
            } else if (budget.period === "one-time") {
                // Para presupuestos únicos, solo el primer mes tiene el presupuesto
                monthlyBudget = month === months[0] ? budget.amount : 0;
            }

            const available = monthlyBudget + carryOver - totalSpent;

            monthlyData.push({
                month,
                label: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
                totalSpent,
                budgetAmount: monthlyBudget,
                carryOver,
                available,
                expenses: monthExpenses.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ),
            });

            // El carry-over para el siguiente mes es lo que sobra/falta
            carryOver = available;
        }

        // Revertir para mostrar más recientes primero
        monthlyData.reverse();

        // Datos del mes actual
        const currentMonthData = monthlyData.find(m => m.month === currentMonth) || monthlyData[0];

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
            // Histórico por meses
            monthlyHistory: monthlyData,
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
