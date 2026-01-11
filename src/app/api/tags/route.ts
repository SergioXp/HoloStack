import { db } from "@/db";
import { tags } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const allTags = await db.select().from(tags);
        return Response.json(allTags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return Response.json({ error: "Failed to fetch tags" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, color } = body;

        if (!name) {
            return Response.json({ error: "Tag name is required" }, { status: 400 });
        }

        const res = await db.insert(tags).values({
            name,
            color: color || "slate"
        }).returning();

        return Response.json(res[0]);
    } catch (error) {
        console.error("Error creating tag:", error);
        return Response.json({ error: "Failed to create tag" }, { status: 500 });
    }
}
