import { db } from "@/db";
import { userProfiles, collections, collectionItems, budgets, budgetGroups, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { version, data } = body;

        if (!data || !version) {
            return Response.json({ error: "Archivo de respaldo inválido" }, { status: 400 });
        }

        // Ejecutar todo en una transacción para asegurar integridad
        await db.transaction(async (tx) => {
            // 1. Eliminar datos existentes (Orden: tablas dependientes primero)
            await tx.delete(collectionItems);
            await tx.delete(budgetGroups);
            await tx.delete(expenses);
            await tx.delete(budgets);
            await tx.delete(collections);
            await tx.delete(userProfiles);

            // 2. Insertar nuevos datos (Orden: tablas independientes primero)
            if (data.userProfiles && data.userProfiles.length > 0) {
                await tx.insert(userProfiles).values(data.userProfiles);
            }

            if (data.collections && data.collections.length > 0) {
                await tx.insert(collections).values(data.collections);
            }

            if (data.budgets && data.budgets.length > 0) {
                await tx.insert(budgets).values(data.budgets);
            }

            if (data.collectionItems && data.collectionItems.length > 0) {
                await tx.insert(collectionItems).values(data.collectionItems);
            }

            if (data.budgetGroups && data.budgetGroups.length > 0) {
                await tx.insert(budgetGroups).values(data.budgetGroups);
            }

            if (data.expenses && data.expenses.length > 0) {
                await tx.insert(expenses).values(data.expenses);
            }
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error restoring backup:", error);
        return Response.json({ error: "Error restaurando copia de seguridad" }, { status: 500 });
    }
}
