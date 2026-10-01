import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { bugSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {
      companyId: auth.membership.companyId,
    };

    if (projectId) {
      where.projectId = projectId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (severity && severity !== "ALL") {
      where.severity = severity;
    }

    const bugs = await prisma.bug.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
        assignedDev: { select: { id: true, name: true, avatar: true } },
        qaTester: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bugs);
  } catch (error) {
    console.error("Failed to fetch bugs:", error);
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
    const result = bugSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const project = await prisma.project.findFirst({
      where: { id: data.projectId, companyId: auth.membership.companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found in your company" }, { status: 404 });
    }

    const bug = await prisma.bug.create({
      data: {
        companyId: auth.membership.companyId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        priority: data.priority,
        status: data.status,
        environment: data.environment || null,
        browserDevice: data.browserDevice || null,
        stepsToReproduce: data.stepsToReproduce || null,
        expectedResult: data.expectedResult || null,
        actualResult: data.actualResult || null,
        reporterId: auth.user.id,
        assignedDevId: data.assignedDevId || null,
        qaTesterId: data.qaTesterId || null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignedDev: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Record initial activity
    await prisma.bugActivity.create({
      data: {
        bugId: bug.id,
        userId: auth.user.id,
        action: "BUG_REPORTED",
        details: `Reported with ${data.severity} severity and ${data.priority} priority`,
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "BUG_REPORTED",
      entityType: "Bug",
      entityId: bug.id,
      description: `Reported bug "${bug.title}" on project ${project.name}`,
    });

    if (data.assignedDevId && data.assignedDevId !== auth.user.id) {
      await createNotification({
        companyId: auth.membership.companyId,
        userId: data.assignedDevId,
        title: "Bug Assigned",
        message: `Bug "${bug.title}" has been assigned to you.`,
        type: "BUG_ASSIGNED",
        entityType: "bug",
        entityId: bug.id,
      });
    }

    return NextResponse.json(bug, { status: 201 });
  } catch (error) {
    console.error("Failed to create bug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
