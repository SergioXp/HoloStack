import { db } from "@/db";
import { expenses, budgets } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// GET - Listar gastos de un presupuesto
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");

    try {
        // Verificar que el presupuesto existe
        const budget = await db.query.budgets.findFirst({
            where: eq(budgets.id, id),
        });

        if (!budget) {
            return Response.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        // Construir condiciones
        const conditions = [eq(expenses.budgetId, id)];

        if (startDate) conditions.push(gte(expenses.date, startDate));
        if (endDate) conditions.push(lte(expenses.date, endDate));
        if (category) conditions.push(eq(expenses.category, category));
        if (platform) conditions.push(eq(expenses.platform, platform));

        const expensesList = await db
            .select()
            .from(expenses)
            .where(and(...conditions))
            .orderBy(desc(expenses.date), desc(expenses.createdAt));

        return Response.json(expensesList);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return Response.json({ error: "Error obteniendo gastos" }, { status: 500 });
    }
}

// POST - Crear nuevo gasto
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { date, description, category, amount, currency, packCount, seller, platform, notes, cardId } = body;

        if (!date || !description || !amount) {
            return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // Verificar que el presupuesto existe
        const budget = await db.query.budgets.findFirst({
            where: eq(budgets.id, id),
        });

        if (!budget) {
            return Response.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        const [newExpense] = await db.insert(expenses).values({
            budgetId: id,
            date,
            description,
            category: category || "other",
            amount,
            currency: currency || budget.currency,
            packCount: packCount || null,
            seller: seller || null,
            platform: platform || null,
            notes: notes || null,
            cardId: cardId || null,
        }).returning();

        revalidatePath(`/budgets/${id}`);

        return Response.json(newExpense);
    } catch (error) {
        console.error("Error creating expense:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
