import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: [{ companyId: auth.membership.companyId }, { companyId: null }],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    const allPermissions = await prisma.permission.findMany();

    return NextResponse.json({ roles, allPermissions });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
