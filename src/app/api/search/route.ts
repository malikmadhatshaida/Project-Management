import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type") || "ALL";

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const companyId = auth.membership.companyId;
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      url: string;
    }> = [];

    // 1. Projects
    if (type === "ALL" || type === "PROJECTS") {
      const projects = await prisma.project.findMany({
        where: {
          companyId,
          isDeleted: false,
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
      });

      projects.forEach((p) => {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: `Project Code: ${p.code} • Status: ${p.status}`,
          type: "Project",
          url: `/projects/${p.id}`,
        });
      });
    }

    // 2. Tasks
    if (type === "ALL" || type === "TASKS") {
      const tasks = await prisma.task.findMany({
        where: {
          companyId,
          isDeleted: false,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: { project: { select: { name: true } } },
        take: 5,
      });

      tasks.forEach((t) => {
        results.push({
          id: t.id,
          title: t.title,
          subtitle: `Task in ${t.project.name} • Status: ${t.status}`,
          type: "Task",
          url: `/tasks/${t.id}`,
        });
      });
    }

    // 3. Bugs
    if (type === "ALL" || type === "BUGS") {
      const bugs = await prisma.bug.findMany({
        where: {
          companyId,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: { project: { select: { name: true } } },
        take: 5,
      });

      bugs.forEach((b) => {
        results.push({
          id: b.id,
          title: b.title,
          subtitle: `Bug in ${b.project.name} • Severity: ${b.severity} • Status: ${b.status}`,
          type: "Bug",
          url: `/bugs/${b.id}`,
        });
      });
    }

    // 4. Employees
    if (type === "ALL" || type === "EMPLOYEES") {
      const members = await prisma.companyMember.findMany({
        where: {
          companyId,
          user: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { jobTitle: { contains: query } },
            ],
          },
        },
        include: { user: true, role: true, department: true },
        take: 5,
      });

      members.forEach((m) => {
        results.push({
          id: m.userId,
          title: m.user.name,
          subtitle: `${m.user.jobTitle || m.role.displayName} • ${m.department?.name || "Company Member"}`,
          type: "Employee",
          url: `/employees/${m.userId}`,
        });
      });
    }

    // 5. Documents
    if (type === "ALL" || type === "DOCUMENTS") {
      const documents = await prisma.document.findMany({
        where: {
          companyId,
          isDeleted: false,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
      });

      documents.forEach((d) => {
        results.push({
          id: d.id,
          title: d.title,
          subtitle: `Document • ${d.fileType}`,
          type: "Document",
          url: `/documents`,
        });
      });
    }

    // 6. Requests
    if (type === "ALL" || type === "REQUESTS") {
      const requests = await prisma.request.findMany({
        where: {
          companyId,
          OR: [
            { subject: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 5,
      });

      requests.forEach((r) => {
        results.push({
          id: r.id,
          title: r.subject,
          subtitle: `Request: ${r.type} • Status: ${r.status}`,
          type: "Request",
          url: `/requests/${r.id}`,
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
