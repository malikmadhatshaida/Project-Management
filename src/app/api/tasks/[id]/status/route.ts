import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";

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
    const { status, orderIndex } = body;

    const validStatuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const oldStatus = task.status;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
      },
    });

    if (oldStatus !== status) {
      await prisma.taskActivity.create({
        data: {
          taskId: id,
          userId: auth.user.id,
          action: "STATUS_CHANGED",
          details: `Moved from ${oldStatus} to ${status} via Kanban board`,
        },
      });

      await logAuditAction({
        companyId: auth.membership.companyId,
        actorId: auth.user.id,
        action: "TASK_STATUS_CHANGED",
        entityType: "Task",
        entityId: id,
        description: `Task "${task.title}" status changed to ${status}`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
