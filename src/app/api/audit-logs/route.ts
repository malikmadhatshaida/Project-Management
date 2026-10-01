import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Protect audit logs from ordinary employees
    const canView =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.permissions.includes("AUDIT_LOG_VIEW");

    if (!canView) {
      return NextResponse.json(
        { error: "Forbidden: Audit logs are restricted to company administrators." },
        { status: 403 }
      );
    }

    const logs = await prisma.auditLog.findMany({
      where: { companyId: auth.membership.companyId },
      include: {
        actor: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
