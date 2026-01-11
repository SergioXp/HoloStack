import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// GET - Obtener un gasto específico
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const expense = await db.query.expenses.findFirst({
            where: eq(expenses.id, id),
        });

        if (!expense) {
            return Response.json({ error: "Gasto no encontrado" }, { status: 404 });
        }

        return Response.json(expense);
    } catch (error) {
        console.error("Error fetching expense:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PUT - Actualizar gasto
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        const existing = await db.query.expenses.findFirst({
            where: eq(expenses.id, id),
        });

        if (!existing) {
            return Response.json({ error: "Gasto no encontrado" }, { status: 404 });
        }

        const updateData: Record<string, any> = {};

        if (body.date !== undefined) updateData.date = body.date;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.amount !== undefined) updateData.amount = body.amount;
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.packCount !== undefined) updateData.packCount = body.packCount;
        if (body.seller !== undefined) updateData.seller = body.seller;
        if (body.platform !== undefined) updateData.platform = body.platform;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.cardId !== undefined) updateData.cardId = body.cardId;

        const [updated] = await db.update(expenses)
            .set(updateData)
            .where(eq(expenses.id, id))
            .returning();

        revalidatePath(`/budgets/${existing.budgetId}`);

        return Response.json(updated);
    } catch (error) {
        console.error("Error updating expense:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE - Eliminar gasto
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const existing = await db.query.expenses.findFirst({
            where: eq(expenses.id, id),
        });

        if (!existing) {
            return Response.json({ error: "Gasto no encontrado" }, { status: 404 });
        }

        await db.delete(expenses).where(eq(expenses.id, id));

        revalidatePath(`/budgets/${existing.budgetId}`);

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return Response.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
