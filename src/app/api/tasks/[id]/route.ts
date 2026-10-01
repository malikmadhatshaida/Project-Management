import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId: auth.membership.companyId,
        isDeleted: false,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { id: true, name: true, avatar: true, email: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
          },
        },
        subtasks: {
          where: { isDeleted: false },
          include: {
            assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
          orderBy: { orderIndex: "asc" },
        },
        checklists: { orderBy: { orderIndex: "asc" } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        timeEntries: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.task.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update assignees if passed
    if (body.assigneeIds && Array.isArray(body.assigneeIds)) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (body.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: body.assigneeIds.map((userId: string) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        status: body.status !== undefined ? body.status : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        estimatedHours: body.estimatedHours !== undefined ? body.estimatedHours : undefined,
        actualHours: body.actualHours !== undefined ? body.actualHours : undefined,
        orderIndex: body.orderIndex !== undefined ? body.orderIndex : undefined,
      },
    });

    // Record activity
    let actionDesc = `Updated task "${updated.title}"`;
    if (body.status && body.status !== existing.status) {
      actionDesc = `Changed status from ${existing.status} to ${body.status}`;
    }

    await prisma.taskActivity.create({
      data: {
        taskId: id,
        userId: auth.user.id,
        action: body.status !== existing.status ? "STATUS_CHANGED" : "TASK_UPDATED",
        details: actionDesc,
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "TASK_UPDATED",
      entityType: "Task",
      entityId: id,
      description: actionDesc,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "TASK_DELETED",
      entityType: "Task",
      entityId: id,
      description: `Task "${task.title}" deleted by ${auth.user.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
