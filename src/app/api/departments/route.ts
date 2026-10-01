import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      where: { companyId: auth.membership.companyId },
      include: {
        manager: { select: { id: true, name: true, avatar: true, email: true } },
        teams: {
          include: {
            teamLead: { select: { id: true, name: true, avatar: true } },
            _count: { select: { members: true } },
          },
        },
        _count: {
          select: {
            members: true,
            projects: { where: { isDeleted: false } },
            tasks: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Failed to fetch departments:", error);
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
    const { name, description, managerId } = body;

    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const dept = await prisma.department.create({
      data: {
        companyId: auth.membership.companyId,
        name,
        description: description || null,
        managerId: managerId || null,
      },
      include: {
        manager: { select: { id: true, name: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "DEPARTMENT_CREATED",
      entityType: "Department",
      entityId: dept.id,
      description: `Created department "${dept.name}"`,
    });

    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    console.error("Failed to create department:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
