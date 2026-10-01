import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { projectSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: any = {
      companyId: auth.membership.companyId,
      isDeleted: false,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    // Role-based visibility: CLIENT only sees projects they are explicitly a member of
    if (auth.membership.roleName === "CLIENT") {
      where.members = {
        some: { userId: auth.user.id },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true } },
        manager: { select: { id: true, name: true, avatar: true, email: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true } },
          },
        },
        _count: {
          select: {
            tasks: { where: { isDeleted: false } },
            bugs: true,
            documents: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.permissions.includes("PROJECT_CREATE");

    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const result = projectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const project = await prisma.project.create({
      data: {
        companyId: auth.membership.companyId,
        name: data.name,
        code: data.code,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        ownerId: auth.user.id,
        managerId: data.managerId || auth.user.id,
        departmentId: data.departmentId || null,
        teamId: data.teamId || null,
        members: {
          create: {
            userId: auth.user.id,
            role: "MANAGER",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        manager: { select: { id: true, name: true, avatar: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: project.id,
      description: `Project ${project.name} (${project.code}) created by ${auth.user.name}`,
    });

    if (data.managerId && data.managerId !== auth.user.id) {
      await createNotification({
        companyId: auth.membership.companyId,
        userId: data.managerId,
        title: "Assigned as Project Manager",
        message: `You were assigned as Project Manager for "${project.name}" (${project.code})`,
        type: "PROJECT_ADDED",
        entityType: "project",
        entityId: project.id,
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A project with this project code already exists in your company." },
        { status: 409 }
      );
    }
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
