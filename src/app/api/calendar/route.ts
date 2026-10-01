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
    const month = searchParams.get("month"); // e.g. "2026-09" or empty

    const companyId = auth.membership.companyId;

    // Fetch tasks with dueDate
    const tasks = await prisma.task.findMany({
      where: {
        companyId,
        isDeleted: false,
        dueDate: { not: null },
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    // Fetch projects with endDate
    const projects = await prisma.project.findMany({
      where: {
        companyId,
        isDeleted: false,
        endDate: { not: null },
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    // Fetch meetings
    const meetings = await prisma.meeting.findMany({
      where: { companyId },
      include: {
        project: { select: { id: true, name: true, code: true } },
        organizer: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Fetch milestones with dueDate
    const milestones = await prisma.milestone.findMany({
      where: {
        project: { companyId, isDeleted: false },
        dueDate: { not: null },
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // Transform into unified calendar events
    const events: Array<{
      id: string;
      title: string;
      date: string;
      type: "TASK" | "PROJECT" | "MEETING" | "MILESTONE";
      status?: string;
      priority?: string;
      startTime?: string;
      endTime?: string;
      relatedProject?: string;
    }> = [];

    tasks.forEach((t) => {
      if (t.dueDate) {
        events.push({
          id: `task-${t.id}`,
          title: `Task: ${t.title}`,
          date: t.dueDate.toISOString().split("T")[0],
          type: "TASK",
          status: t.status,
          priority: t.priority,
          relatedProject: t.project.name,
        });
      }
    });

    projects.forEach((p) => {
      if (p.endDate) {
        events.push({
          id: `proj-${p.id}`,
          title: `Project Deadline: ${p.name} (${p.code})`,
          date: p.endDate.toISOString().split("T")[0],
          type: "PROJECT",
          status: p.status,
          priority: p.priority,
          relatedProject: p.name,
        });
      }
    });

    meetings.forEach((m) => {
      events.push({
        id: `meet-${m.id}`,
        title: `Meeting: ${m.title}`,
        date: m.date.toISOString().split("T")[0],
        type: "MEETING",
        startTime: m.startTime,
        endTime: m.endTime,
        relatedProject: m.project?.name,
      });
    });

    milestones.forEach((ms) => {
      if (ms.dueDate) {
        events.push({
          id: `ms-${ms.id}`,
          title: `Milestone: ${ms.title}`,
          date: ms.dueDate.toISOString().split("T")[0],
          type: "MILESTONE",
          status: ms.status,
          relatedProject: ms.project.name,
        });
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
