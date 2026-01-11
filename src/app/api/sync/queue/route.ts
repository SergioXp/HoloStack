import { db } from "@/db";
import { syncJobs } from "@/db/schema";
import { eq, desc, or, and, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: Obtener estado de la cola
export async function GET() {
    try {
        const jobs = await db.select()
            .from(syncJobs)
            .where(or(
                eq(syncJobs.status, "pending"),
                eq(syncJobs.status, "running"),
                eq(syncJobs.status, "paused"),
                eq(syncJobs.status, "error")
            ))
            .orderBy(desc(syncJobs.priority), syncJobs.createdAt);

        // También obtener los últimos 5 completados/error para historial
        const recentCompleted = await db.select()
            .from(syncJobs)
            .where(or(
                eq(syncJobs.status, "done"),
                eq(syncJobs.status, "error")
            ))
            .orderBy(desc(syncJobs.completedAt))
            .limit(5);

        return NextResponse.json({
            active: jobs,
            recent: recentCompleted,
            hasRunning: jobs.some(j => j.status === "running"),
            pendingCount: jobs.filter(j => j.status === "pending").length
        });
    } catch (error) {
        console.error("[Queue] GET error:", error);
        return NextResponse.json({ error: "Error al obtener cola" }, { status: 500 });
    }
}

// POST: Añadir trabajo a la cola
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, targetId, targetName, priority = 0 } = body;

        if (!type) {
            return NextResponse.json({ error: "Falta el tipo de trabajo" }, { status: 400 });
        }

        // Verificar si ya existe un trabajo pendiente/corriendo para este target
        const existing = await db.select()
            .from(syncJobs)
            .where(and(
                eq(syncJobs.targetId, targetId || ""),
                or(
                    eq(syncJobs.status, "pending"),
                    eq(syncJobs.status, "running")
                )
            ))
            .limit(1);

        if (existing.length > 0) {
            // Si ya existe y se pide prioridad alta, actualizar prioridad
            if (priority > (existing[0].priority ?? 0)) {
                await db.update(syncJobs)
                    .set({ priority })
                    .where(eq(syncJobs.id, existing[0].id));

                return NextResponse.json({
                    success: true,
                    action: "prioritized",
                    job: { ...existing[0], priority }
                });
            }

            return NextResponse.json({
                success: true,
                action: "already_exists",
                job: existing[0]
            });
        }

        // Crear nuevo trabajo
        const newJob = await db.insert(syncJobs).values({
            type,
            targetId,
            targetName,
            priority,
            status: "pending",
            createdAt: new Date()
        }).returning();

        console.log(`[Queue] New job created: ${type} - ${targetName || targetId}`);

        return NextResponse.json({
            success: true,
            action: "created",
            job: newJob[0]
        });

    } catch (error) {
        console.error("[Queue] POST error:", error);
        return NextResponse.json({ error: "Error al crear trabajo" }, { status: 500 });
    }
}

// PATCH: Actualizar trabajo (prioridad, pausar, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, priority, status } = body;

        if (!id) {
            return NextResponse.json({ error: "Falta ID del trabajo" }, { status: 400 });
        }

        const updateData: any = {};
        if (priority !== undefined) updateData.priority = priority;
        if (status !== undefined) updateData.status = status;

        await db.update(syncJobs)
            .set(updateData)
            .where(eq(syncJobs.id, id));

        console.log(`[Queue] Job updated: ${id}`, updateData);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Queue] PATCH error:", error);
        return NextResponse.json({ error: "Error al actualizar trabajo" }, { status: 500 });
    }
}

// DELETE: Cancelar/eliminar trabajo
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Falta ID del trabajo" }, { status: 400 });
        }

        // Solo permitir eliminar trabajos pendientes o con error
        const job = await db.select()
            .from(syncJobs)
            .where(eq(syncJobs.id, id))
            .limit(1);

        if (job.length === 0) {
            return NextResponse.json({ error: "Trabajo no encontrado" }, { status: 404 });
        }

        if (job[0].status === "running") {
            return NextResponse.json({ error: "No se puede eliminar un trabajo en ejecución" }, { status: 400 });
        }

        await db.delete(syncJobs).where(eq(syncJobs.id, id));

        console.log(`[Queue] Job deleted: ${id}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Queue] DELETE error:", error);
        return NextResponse.json({ error: "Error al eliminar trabajo" }, { status: 500 });
    }
}
