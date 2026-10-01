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

    const company = await prisma.company.findUnique({
      where: { id: auth.membership.companyId },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Failed to fetch company settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.permissions.includes("COMPANY_SETTINGS_MANAGE");

    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: Only company administrators can modify company settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, timezone, workingDays, workingHours, logo } = body;

    const updated = await prisma.company.update({
      where: { id: auth.membership.companyId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        workingDays: workingDays !== undefined ? workingDays : undefined,
        workingHours: workingHours !== undefined ? workingHours : undefined,
        logo: logo !== undefined ? logo : undefined,
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "COMPANY_SETTINGS_UPDATED",
      entityType: "Company",
      entityId: updated.id,
      description: `Company settings updated by ${auth.user.name}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update company settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
