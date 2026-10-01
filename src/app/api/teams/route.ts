import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const where: any = {
      companyId: auth.membership.companyId,
    };
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        teamLead: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
          },
        },
        _count: {
          select: {
            projects: { where: { isDeleted: false } },
            tasks: { where: { isDeleted: false } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
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
    const { name, description, departmentId, teamLeadId } = body;

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        companyId: auth.membership.companyId,
        name,
        description: description || null,
        departmentId: departmentId || null,
        teamLeadId: teamLeadId || null,
      },
      include: {
        department: { select: { id: true, name: true } },
        teamLead: { select: { id: true, name: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "TEAM_CREATED",
      entityType: "Team",
      entityId: team.id,
      description: `Created team "${team.name}"`,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Failed to create team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
