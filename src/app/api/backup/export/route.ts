import { db } from "@/db";
import { userProfiles, collections, collectionItems, budgets, budgetGroups, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const profileData = await db.select().from(userProfiles);
        const collectionsData = await db.select().from(collections);
        const itemsData = await db.select().from(collectionItems);
        const budgetsData = await db.select().from(budgets);
        const budgetGroupsData = await db.select().from(budgetGroups);
        const expensesData = await db.select().from(expenses);

        const backup = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                userProfiles: profileData,
                collections: collectionsData,
                collectionItems: itemsData,
                budgets: budgetsData,
                budgetGroups: budgetGroupsData,
                expenses: expensesData,
            }
        };

        return Response.json(backup);
    } catch (error) {
        console.error("Error creating backup:", error);
        return Response.json({ error: "Error creating export" }, { status: 500 });
    }
}
