import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications/notify";

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
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id, companyId: auth.membership.companyId },
      include: {
        assignees: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorId: auth.user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });

    // Detect @mentions (e.g., @Marcus or @Alex)
    const mentionMatches = content.match(/@(\w+)/g);
    if (mentionMatches) {
      const companyUsers = await prisma.user.findMany({
        where: {
          memberships: { some: { companyId: auth.membership.companyId } },
        },
      });

      for (const m of mentionMatches) {
        const username = m.substring(1).toLowerCase();
        const matchedUser = companyUsers.find(
          (u) =>
            u.name.toLowerCase().includes(username) ||
            u.email.toLowerCase().includes(username)
        );

        if (matchedUser && matchedUser.id !== auth.user.id) {
          await createNotification({
            companyId: auth.membership.companyId,
            userId: matchedUser.id,
            title: "Mentioned in comment",
            message: `${auth.user.name} mentioned you on task: "${task.title}"`,
            type: "MENTION",
            entityType: "task",
            entityId: task.id,
          });
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
