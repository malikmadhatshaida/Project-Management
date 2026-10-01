import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { taskSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const myWork = searchParams.get("myWork");

    const where: any = {
      companyId: auth.membership.companyId,
      isDeleted: false,
    };

    if (projectId) {
      where.projectId = projectId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (assigneeId) {
      where.assignees = {
        some: { userId: assigneeId },
      };
    }
    if (myWork === "true") {
      where.assignees = {
        some: { userId: auth.user.id },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true } },
          },
        },
        checklists: { orderBy: { orderIndex: "asc" } },
        subtasks: {
          where: { isDeleted: false },
          include: {
            assignees: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
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
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, companyId: auth.membership.companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found in your company" }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        companyId: auth.membership.companyId,
        projectId: data.projectId,
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        parentTaskId: data.parentTaskId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        reporterId: auth.user.id,
        assignees: data.assigneeIds?.length
          ? {
              create: data.assigneeIds.map((uId) => ({ userId: uId })),
            }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: task.id,
      description: `Task "${task.title}" created in project ${project.name}`,
    });

    // Notify assignees
    if (data.assigneeIds?.length) {
      for (const uId of data.assigneeIds) {
        if (uId !== auth.user.id) {
          await createNotification({
            companyId: auth.membership.companyId,
            userId: uId,
            title: "Task Assigned",
            message: `You were assigned to "${task.title}" in ${project.name}`,
            type: "TASK_ASSIGNED",
            entityType: "task",
            entityId: task.id,
          });
        }
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
