import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

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

    const bug = await prisma.bug.findFirst({
      where: { id, companyId: auth.membership.companyId },
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { id: true, name: true, avatar: true, email: true } },
        assignedDev: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        qaTester: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error("Failed to fetch bug:", error);
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

    const existing = await prisma.bug.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const updated = await prisma.bug.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        status: body.status !== undefined ? body.status : undefined,
        severity: body.severity !== undefined ? body.severity : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        assignedDevId: body.assignedDevId !== undefined ? body.assignedDevId : undefined,
        qaTesterId: body.qaTesterId !== undefined ? body.qaTesterId : undefined,
        resolvedAt: body.status === "FIXED" || body.status === "CLOSED" ? new Date() : (body.status === "REOPENED" ? null : undefined),
      },
    });

    if (body.status && body.status !== existing.status) {
      await prisma.bugActivity.create({
        data: {
          bugId: id,
          userId: auth.user.id,
          action: "STATUS_CHANGED",
          details: `Changed bug status from ${existing.status} to ${body.status}`,
        },
      });

      if (body.status === "REOPENED" && existing.assignedDevId) {
        await createNotification({
          companyId: auth.membership.companyId,
          userId: existing.assignedDevId,
          title: "Bug Reopened",
          message: `Bug "${updated.title}" was reopened by ${auth.user.name}.`,
          type: "BUG_REOPENED",
          entityType: "bug",
          entityId: id,
        });
      }
    }

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "BUG_UPDATED",
      entityType: "Bug",
      entityId: id,
      description: `Updated bug "${updated.title}" (Status: ${updated.status})`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update bug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
