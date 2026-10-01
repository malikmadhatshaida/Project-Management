import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requestSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const myOnly = searchParams.get("myOnly");

    const where: any = {
      companyId: auth.membership.companyId,
    };

    if (type && type !== "ALL") {
      where.type = type;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    // If regular employee or requested myOnly, filter to own requests unless admin/HR
    const isAdminOrHr =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.membership.roleName === "TEAM_LEAD" ||
      auth.permissions.includes("REQUEST_APPROVE");

    if (!isAdminOrHr || myOnly === "true") {
      where.requesterId = auth.user.id;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, avatar: true, email: true, jobTitle: true } },
        assignedDepartment: { select: { id: true, name: true } },
        assignedEmployee: { select: { id: true, name: true } },
        approvals: {
          include: { approver: { select: { id: true, name: true, jobTitle: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch requests:", error);
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
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const requestItem = await prisma.request.create({
      data: {
        companyId: auth.membership.companyId,
        requesterId: auth.user.id,
        type: data.type,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: "PENDING",
        assignedDepartmentId: data.assignedDepartmentId || null,
      },
      include: {
        requester: { select: { id: true, name: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "REQUEST_CREATED",
      entityType: "Request",
      entityId: requestItem.id,
      description: `${auth.user.name} submitted ${data.type} request: "${data.subject}"`,
    });

    return NextResponse.json(requestItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
