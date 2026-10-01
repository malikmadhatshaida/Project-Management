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
    const projectId = searchParams.get("projectId");
    const departmentId = searchParams.get("departmentId");

    const where: any = {
      companyId: auth.membership.companyId,
      isDeleted: false,
    };

    if (projectId) where.projectId = projectId;
    if (departmentId) where.departmentId = departmentId;

    const documents = await prisma.document.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        versions: { orderBy: { versionNumber: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
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
    const { title, description, fileUrl, fileType, fileSize, projectId, departmentId, teamId } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        companyId: auth.membership.companyId,
        title,
        description: description || null,
        fileUrl,
        fileType: fileType || "application/pdf",
        fileSize: fileSize || 1024,
        createdById: auth.user.id,
        projectId: projectId || null,
        departmentId: departmentId || null,
        teamId: teamId || null,
        versions: {
          create: {
            versionNumber: 1,
            fileUrl,
            changeLog: "Initial upload",
            createdById: auth.user.id,
          },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document.id,
      description: `${auth.user.name} uploaded document "${document.title}"`,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
