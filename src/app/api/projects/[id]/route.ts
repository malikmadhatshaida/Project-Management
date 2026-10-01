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

    const project = await prisma.project.findFirst({
      where: {
        id,
        companyId: auth.membership.companyId,
        isDeleted: false,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        manager: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        department: true,
        team: true,
        tags: { include: { tag: true } },
        milestones: { orderBy: { dueDate: "asc" } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        },
        tasks: {
          where: { isDeleted: false },
          include: {
            assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            checklists: true,
            _count: { select: { comments: true, attachments: true, subtasks: true } },
          },
          orderBy: { orderIndex: "asc" },
        },
        bugs: {
          include: {
            assignedDev: { select: { id: true, name: true, avatar: true } },
            reporter: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          where: { isDeleted: false },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
        meetings: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project details:", error);
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

    const existing = await prisma.project.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        status: body.status !== undefined ? body.status : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        progress: body.progress !== undefined ? body.progress : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        managerId: body.managerId !== undefined ? body.managerId : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId : undefined,
        teamId: body.teamId !== undefined ? body.teamId : undefined,
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "PROJECT_UPDATED",
      entityType: "Project",
      entityId: id,
      description: `Project ${updated.name} updated by ${auth.user.name}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update project:", error);
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

    const project = await prisma.project.findFirst({
      where: { id, companyId: auth.membership.companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.project.update({
      where: { id },
      data: { isDeleted: true },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "PROJECT_DELETED",
      entityType: "Project",
      entityId: id,
      description: `Project ${project.name} soft-deleted by ${auth.user.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
