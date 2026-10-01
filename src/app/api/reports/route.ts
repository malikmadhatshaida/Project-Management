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
    const exportCsv = searchParams.get("export") === "csv";
    const companyId = auth.membership.companyId;

    // Fetch metrics
    const [projects, tasks, bugs, members, departments, timeEntries, requests] = await Promise.all([
      prisma.project.findMany({
        where: { companyId, isDeleted: false },
        include: { _count: { select: { tasks: true, bugs: true } } },
      }),
      prisma.task.findMany({
        where: { companyId, isDeleted: false },
        include: {
          project: { select: { name: true, code: true } },
          assignees: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.bug.findMany({
        where: { companyId },
        include: { project: { select: { name: true } } },
      }),
      prisma.companyMember.findMany({
        where: { companyId },
        include: {
          user: true,
          role: true,
          department: true,
        },
      }),
      prisma.department.findMany({
        where: { companyId },
        include: {
          _count: { select: { members: true, projects: true, tasks: true } },
        },
      }),
      prisma.timeEntry.findMany({
        where: { companyId },
        include: { user: { select: { name: true } } },
      }),
      prisma.request.findMany({
        where: { companyId },
      }),
    ]);

    // Tasks by status
    const tasksByStatus = {
      BACKLOG: tasks.filter((t) => t.status === "BACKLOG").length,
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      IN_REVIEW: tasks.filter((t) => t.status === "IN_REVIEW").length,
      BLOCKED: tasks.filter((t) => t.status === "BLOCKED").length,
      COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
    };

    // Tasks by priority
    const tasksByPriority = {
      LOW: tasks.filter((t) => t.priority === "LOW").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
      HIGH: tasks.filter((t) => t.priority === "HIGH").length,
      URGENT: tasks.filter((t) => t.priority === "URGENT").length,
    };

    // Bugs by severity
    const bugsBySeverity = {
      LOW: bugs.filter((b) => b.severity === "LOW").length,
      MEDIUM: bugs.filter((b) => b.severity === "MEDIUM").length,
      HIGH: bugs.filter((b) => b.severity === "HIGH").length,
      CRITICAL: bugs.filter((b) => b.severity === "CRITICAL").length,
    };

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
    );

    // Total hours logged
    const totalMinutesLogged = timeEntries.reduce((acc, te) => acc + te.durationMinutes, 0);

    // If CSV export is requested:
    if (exportCsv) {
      const csvHeader = "Task ID,Title,Project,Status,Priority,Due Date,Estimated Hours,Actual Hours\n";
      const csvRows = tasks
        .map((t) =>
          `"${t.id}","${t.title.replace(/"/g, '""')}","${t.project.name}","${t.status}","${t.priority}","${t.dueDate ? t.dueDate.toISOString().split("T")[0] : ""}","${t.estimatedHours || 0}","${t.actualHours || 0}"`
        )
        .join("\n");

      return new Response(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="tasks-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
        totalTasks: tasks.length,
        completedTasks: tasksByStatus.COMPLETED,
        overdueTasksCount: overdueTasks.length,
        totalBugs: bugs.length,
        openBugs: bugs.filter((b) => b.status !== "CLOSED" && b.status !== "FIXED").length,
        totalEmployees: members.length,
        totalHoursLogged: Number((totalMinutesLogged / 60).toFixed(1)),
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length,
      },
      tasksByStatus,
      tasksByPriority,
      bugsBySeverity,
      projectsList: projects.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        progress: p.progress,
        status: p.status,
        priority: p.priority,
        tasksCount: p._count.tasks,
        bugsCount: p._count.bugs,
      })),
      departmentsList: departments.map((d) => ({
        id: d.id,
        name: d.name,
        memberCount: d._count.members,
        projectCount: d._count.projects,
        taskCount: d._count.tasks,
      })),
    });
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
