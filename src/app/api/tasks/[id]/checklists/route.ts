import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
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
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const count = await prisma.taskChecklist.count({ where: { taskId: id } });

    const item = await prisma.taskChecklist.create({
      data: {
        taskId: id,
        title: title.trim(),
        orderIndex: count,
        isCompleted: false,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to add checklist item:", error);
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
    const { itemId, isCompleted } = body;

    const checklistItem = await prisma.taskChecklist.findFirst({
      where: { id: itemId, taskId: id },
    });

    if (!checklistItem) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    const updated = await prisma.taskChecklist.update({
      where: { id: itemId },
      data: { isCompleted: Boolean(isCompleted) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update checklist item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
