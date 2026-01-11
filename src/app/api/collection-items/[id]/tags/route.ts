
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { itemTags, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await db
            .select({
                id: tags.id,
                name: tags.name,
                color: tags.color
            })
            .from(itemTags)
            .innerJoin(tags, eq(itemTags.tagId, tags.id))
            .where(eq(itemTags.itemId, id))
            .all();

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching item tags:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id: itemId } = await params;
        const body = await req.json();
        const { tagId } = body;

        if (!tagId) return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });

        // Check if already assigned
        const existing = await db
            .select()
            .from(itemTags)
            .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)))
            .get();

        if (existing) return NextResponse.json(existing);

        const newAssignment = await db.insert(itemTags).values({
            itemId,
            tagId
        }).returning().get();

        return NextResponse.json(newAssignment);
    } catch (error) {
        console.error("Error assigning tag:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id: itemId } = await params;
        const body = await req.json();
        const { tagId } = body;

        if (!tagId) return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });

        await db
            .delete(itemTags)
            .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)))
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing tag:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
