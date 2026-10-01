import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const PERMISSION_DEFINITIONS = [
  // Company
  { code: "COMPANY_VIEW", name: "View Company", module: "Company", description: "View company profile and details" },
  { code: "COMPANY_EDIT", name: "Edit Company", module: "Company", description: "Update company profile information" },
  { code: "COMPANY_SETTINGS_MANAGE", name: "Manage Company Settings", module: "Company", description: "Configure system preferences and tenant settings" },
  
  // Employees
  { code: "EMPLOYEE_VIEW", name: "View Employees", module: "Employees", description: "View employee directory and profiles" },
  { code: "EMPLOYEE_CREATE", name: "Create Employee", module: "Employees", description: "Add new employees directly" },
  { code: "EMPLOYEE_EDIT", name: "Edit Employee", module: "Employees", description: "Update employee details, role, department" },
  { code: "EMPLOYEE_DELETE", name: "Delete Employee", module: "Employees", description: "Deactivate or remove employees" },
  { code: "EMPLOYEE_INVITE", name: "Invite Employee", module: "Employees", description: "Send invitation emails to prospective employees" },
  
  // Departments & Teams
  { code: "DEPARTMENT_CREATE", name: "Create Department", module: "Structure", description: "Create departments" },
  { code: "DEPARTMENT_EDIT", name: "Edit Department", module: "Structure", description: "Edit departments" },
  { code: "DEPARTMENT_DELETE", name: "Delete Department", module: "Structure", description: "Delete departments" },
  { code: "TEAM_CREATE", name: "Create Team", module: "Structure", description: "Create teams" },
  { code: "TEAM_EDIT", name: "Edit Team", module: "Structure", description: "Edit teams" },
  { code: "TEAM_DELETE", name: "Delete Team", module: "Structure", description: "Delete teams" },
  
  // Projects
  { code: "PROJECT_VIEW", name: "View Projects", module: "Projects", description: "Access project workspaces" },
  { code: "PROJECT_CREATE", name: "Create Project", module: "Projects", description: "Create new business projects" },
  { code: "PROJECT_EDIT", name: "Edit Project", module: "Projects", description: "Modify project metadata, members, and settings" },
  { code: "PROJECT_DELETE", name: "Delete Project", module: "Projects", description: "Remove projects from the system" },
  { code: "PROJECT_ARCHIVE", name: "Archive Project", module: "Projects", description: "Archive completed or paused projects" },
  
  // Tasks
  { code: "TASK_VIEW", name: "View Tasks", module: "Tasks", description: "View tasks in list, kanban, calendar, timeline" },
  { code: "TASK_CREATE", name: "Create Task", module: "Tasks", description: "Create new tasks and subtasks" },
  { code: "TASK_EDIT", name: "Edit Task", module: "Tasks", description: "Update task status, assignees, dates, priority" },
  { code: "TASK_DELETE", name: "Delete Task", module: "Tasks", description: "Delete tasks" },
  { code: "TASK_ASSIGN", name: "Assign Task", module: "Tasks", description: "Assign tasks to team members" },
  { code: "TASK_COMMENT", name: "Comment on Tasks", module: "Tasks", description: "Post comments and mentions on tasks" },
  { code: "TASK_ATTACH_FILE", name: "Attach Files to Tasks", module: "Tasks", description: "Upload attachments to tasks" },
  
  // Bugs
  { code: "BUG_CREATE", name: "Create Bug", module: "Bugs", description: "Report new bugs and issues" },
  { code: "BUG_EDIT", name: "Edit Bug", module: "Bugs", description: "Update bug details, priority, severity" },
  { code: "BUG_ASSIGN", name: "Assign Bug", module: "Bugs", description: "Assign bugs to developers and testers" },
  { code: "BUG_RESOLVE", name: "Resolve Bug", module: "Bugs", description: "Change status to resolved or reopen" },
  
  // Requests & Approvals
  { code: "REQUEST_CREATE", name: "Create Request", module: "Requests", description: "Submit internal requests (leave, IT, HR)" },
  { code: "REQUEST_APPROVE", name: "Approve Request", module: "Requests", description: "Review and approve internal requests" },
  { code: "REQUEST_REJECT", name: "Reject Request", module: "Requests", description: "Reject internal requests" },
  
  // Reporting & Audit
  { code: "REPORT_VIEW", name: "View Reports", module: "Reports", description: "Access analytics, dashboards, and exports" },
  { code: "AUDIT_LOG_VIEW", name: "View Audit Logs", module: "Audit", description: "View security and action audit logs" },
  
  // Documents
  { code: "DOCUMENT_CREATE", name: "Create Document", module: "Documents", description: "Upload or create company documents" },
  { code: "DOCUMENT_EDIT", name: "Edit Document", module: "Documents", description: "Update or version documents" },
  { code: "DOCUMENT_DELETE", name: "Delete Document", module: "Documents", description: "Delete documents" },
  
  // Time Tracking
  { code: "TIME_TRACKING_VIEW", name: "View Time Tracking", module: "Time", description: "View personal or team time tracking logs" },
  { code: "TIME_TRACKING_MANAGE", name: "Manage Time Tracking", module: "Time", description: "Approve, edit, and export team time entries" },
];

async function main() {
  console.log("🧹 Starting full database cleanup of all dummy data...");

  // 1. Clear all entity records
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.request.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.bugActivity.deleteMany();
  await prisma.bugAttachment.deleteMany();
  await prisma.bugComment.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskChecklist.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.updateMany({
    data: { parentTaskId: null },
  });
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log("✅ All dummy companies, users, projects, tasks, and activity logs have been removed.");

  // 2. Ensure system RBAC permissions exist so newly registered users & companies function properly
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
      create: perm,
    });
  }

  console.log(`✅ Verified ${PERMISSION_DEFINITIONS.length} essential system RBAC permissions.`);
  console.log("✨ Clean database ready! You can now register a fresh account at /register.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
