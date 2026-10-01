import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const roleId = searchParams.get("roleId");

    const where: any = {
      companyId: auth.membership.companyId,
    };

    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }
    if (roleId && roleId !== "ALL") {
      where.roleId = roleId;
    }

    const members = await prisma.companyMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            jobTitle: true,
            phone: true,
            bio: true,
            skills: true,
            createdAt: true,
            assignedTasks: {
              where: {
                task: {
                  isDeleted: false,
                  status: { not: "COMPLETED" },
                },
              },
              include: { task: true },
            },
          },
        },
        role: true,
        department: true,
        team: true,
      },
      orderBy: { joiningDate: "desc" },
    });

    // Compute active tasks and workload for each employee
    const employeesWithWorkload = members.map((m) => {
      const activeTasks = m.user.assignedTasks.length;
      const totalEstimatedHours = m.user.assignedTasks.reduce(
        (sum, t) => sum + (t.task.estimatedHours || 0),
        0
      );

      return {
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        jobTitle: m.user.jobTitle,
        phone: m.user.phone,
        bio: m.user.bio,
        skills: m.user.skills,
        status: m.status,
        joiningDate: m.joiningDate,
        role: m.role,
        department: m.department,
        team: m.team,
        activeTasksCount: activeTasks,
        workloadHours: totalEstimatedHours,
      };
    });

    return NextResponse.json(employeesWithWorkload);
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canInvite =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.permissions.includes("EMPLOYEE_INVITE") ||
      auth.permissions.includes("EMPLOYEE_CREATE");

    if (!canInvite) {
      return NextResponse.json({ error: "Forbidden: Cannot invite or add employees" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, roleId, departmentId, teamId, jobTitle } = body;

    if (!email || !roleId) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const defaultHash = await hashPassword("password123");
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          passwordHash: defaultHash,
          jobTitle: jobTitle || "Team Member",
        },
      });
    }

    // Check if already a member of this company
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: auth.membership.companyId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already an employee in this company" },
        { status: 409 }
      );
    }

    const member = await prisma.companyMember.create({
      data: {
        companyId: auth.membership.companyId,
        userId: user.id,
        roleId,
        departmentId: departmentId || null,
        teamId: teamId || null,
        status: "ACTIVE",
      },
      include: {
        user: true,
        role: true,
        department: true,
        team: true,
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "EMPLOYEE_ADDED",
      entityType: "Employee",
      entityId: user.id,
      description: `Added ${user.name} (${user.email}) to company as ${member.role.displayName}`,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to add employee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
