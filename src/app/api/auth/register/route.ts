import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { createSession, hashPassword } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 6);

    // Create Company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        description: `Enterprise workspace for ${companyName}`,
      },
    });

    // Fetch all existing permissions or create them
    const allPermissions = await prisma.permission.findMany();

    // Create COMPANY_ADMIN role
    const adminRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: "COMPANY_ADMIN",
        displayName: "Company Administrator",
        description: "Full administrative access within the company",
        isSystem: false,
        permissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });

    // Create standard EMPLOYEE role for this company
    const employeePerms = allPermissions.filter((p) =>
      ["PROJECT_VIEW", "TASK_VIEW", "TASK_EDIT", "TASK_COMMENT", "REQUEST_CREATE", "TIME_TRACKING_VIEW"].includes(p.code)
    );
    await prisma.role.create({
      data: {
        companyId: company.id,
        name: "EMPLOYEE",
        displayName: "Employee",
        description: "Standard employee access",
        isSystem: false,
        permissions: {
          create: employeePerms.map((p) => ({ permissionId: p.id })),
        },
      },
    });

    // Create User
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        memberships: {
          create: {
            companyId: company.id,
            roleId: adminRole.id,
            status: "ACTIVE",
          },
        },
      },
    });

    // Default department
    await prisma.department.create({
      data: {
        companyId: company.id,
        name: "General Operations",
        description: "Primary company organization department",
        managerId: user.id,
      },
    });

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      companyId: company.id,
      roleName: "COMPANY_ADMIN",
      roleId: adminRole.id,
      isSuperAdmin: false,
    });

    await logAuditAction({
      companyId: company.id,
      actorId: user.id,
      action: "COMPANY_REGISTERED",
      entityType: "Company",
      entityId: company.id,
      description: `Company ${company.name} registered by ${user.name}`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyName: company.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
