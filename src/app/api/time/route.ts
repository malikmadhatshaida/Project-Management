import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { timeEntrySchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");
    const myOnly = searchParams.get("myOnly");

    const where: any = {
      companyId: auth.membership.companyId,
    };

    const isManagerOrAdmin =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.membership.roleName === "PROJECT_MANAGER" ||
      auth.permissions.includes("TIME_TRACKING_MANAGE");

    if (!isManagerOrAdmin || myOnly === "true") {
      where.userId = auth.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

    return NextResponse.json({
      entries,
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
    });
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = timeEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const entry = await prisma.timeEntry.create({
      data: {
        companyId: auth.membership.companyId,
        userId: auth.user.id,
        projectId: data.projectId || null,
        taskId: data.taskId || null,
        durationMinutes: data.durationMinutes,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes || null,
        isBillable: data.isBillable,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Also update task actualHours if linked to a task
    if (data.taskId) {
      const allTaskEntries = await prisma.timeEntry.findMany({
        where: { taskId: data.taskId },
      });
      const totalHours = allTaskEntries.reduce((s, e) => s + e.durationMinutes / 60, 0);
      await prisma.task.update({
        where: { id: data.taskId },
        data: { actualHours: Number(totalHours.toFixed(1)) },
      });
    }

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "TIME_LOGGED",
      entityType: "TimeEntry",
      entityId: entry.id,
      description: `${auth.user.name} logged ${data.durationMinutes} minutes of work`,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to log time:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
