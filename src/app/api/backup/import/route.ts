import { db, sqlite } from "@/db";
import { userProfiles, collections, collectionItems, budgets, budgetGroups, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { version, data } = body;

        if (!data || !version) {
            return Response.json({ error: "Archivo de respaldo inválido" }, { status: 400 });
        }

        // Helper para convertir strings de fecha a objetos Date
        const toDate = (dateStr: string | number | Date | null | undefined): Date | undefined => {
            if (!dateStr) return undefined; // No poner fecha si es null/undefined para que entre el default
            return new Date(dateStr);
        };

        // Procesar fechas antes de la transacción (fuera de la transacción para no bloquear)
        const cleanUserProfiles = data.userProfiles?.map((p: any) => ({
            ...p,
            createdAt: toDate(p.createdAt),
            updatedAt: toDate(p.updatedAt)
        })) || [];

        const cleanCollections = data.collections?.map((c: any) => ({
            ...c,
            createdAt: toDate(c.createdAt),
            updatedAt: toDate(c.updatedAt)
        })) || [];

        const cleanBudgets = data.budgets?.map((b: any) => ({
            ...b,
            createdAt: toDate(b.createdAt),
            updatedAt: toDate(b.updatedAt)
        })) || [];

        const cleanCollectionItems = data.collectionItems?.map((i: any) => ({
            ...i,
            addedAt: toDate(i.addedAt)
        })) || [];

        const cleanBudgetGroups = data.budgetGroups || [];

        const cleanExpenses = data.expenses?.map((e: any) => ({
            ...e,
            createdAt: toDate(e.createdAt)
        })) || [];

        // Ejecutar todo en una transacción SINCRONA
        try {
            // Desactivar FKs temporalmente para permitir restaurar items aunque falten cartas (se sincronizarán luego)
            sqlite.pragma('foreign_keys = OFF');

            db.transaction((tx) => {
                // 1. Eliminar datos existentes (Orden: tablas dependientes primero)
                tx.delete(collectionItems).run();
                tx.delete(budgetGroups).run();
                tx.delete(expenses).run();
                tx.delete(budgets).run();
                tx.delete(collections).run();
                tx.delete(userProfiles).run();

                // 2. Insertar nuevos datos (Orden: tablas independientes primero)
                if (cleanUserProfiles.length > 0) {
                    tx.insert(userProfiles).values(cleanUserProfiles).run();
                }

                if (cleanCollections.length > 0) {
                    tx.insert(collections).values(cleanCollections).run();
                }

                if (cleanBudgets.length > 0) {
                    tx.insert(budgets).values(cleanBudgets).run();
                }

                if (cleanCollectionItems.length > 0) {
                    // Chunking para evitar límites de SQL si hay muchos items
                    const chunkSize = 100;
                    for (let i = 0; i < cleanCollectionItems.length; i += chunkSize) {
                        tx.insert(collectionItems).values(cleanCollectionItems.slice(i, i + chunkSize)).run();
                    }
                }

                if (cleanBudgetGroups.length > 0) {
                    tx.insert(budgetGroups).values(cleanBudgetGroups).run();
                }

                if (cleanExpenses.length > 0) {
                    tx.insert(expenses).values(cleanExpenses).run();
                }
            });
        } finally {
            // Asegurarnos de reactivar las FKs pase lo que pase
            sqlite.pragma('foreign_keys = ON');
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error restoring backup:", error);
        return Response.json({ error: "Error restaurando copia de seguridad: " + (error as any).message }, { status: 500 });
    }
}
