import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { createSession, verifyPassword } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            role: true,
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.memberships.length === 0 && !user.isSuperAdmin) {
      return NextResponse.json(
        { error: "No active company membership found for this account." },
        { status: 403 }
      );
    }

    const primaryMembership = user.memberships[0];

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      companyId: primaryMembership?.companyId || "",
      roleName: primaryMembership?.role.name || (user.isSuperAdmin ? "SUPER_ADMIN" : "EMPLOYEE"),
      roleId: primaryMembership?.roleId || "",
      isSuperAdmin: user.isSuperAdmin,
    });

    if (primaryMembership) {
      await logAuditAction({
        companyId: primaryMembership.companyId,
        actorId: user.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: user.id,
        description: `User ${user.name} logged in successfully`,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryMembership?.role.name,
        companyName: primaryMembership?.company.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
