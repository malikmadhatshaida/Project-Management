import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// -------------------------------------------------------------
// CONFIGURE YOUR ADMIN CREDENTIALS HERE
// You can also pass these via environment variables when running:
// ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx prisma/seed-admin.ts
// -------------------------------------------------------------
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Administrator";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const COMPANY_NAME = process.env.COMPANY_NAME || "Main Workspace";
// -------------------------------------------------------------

const PERMISSION_DEFINITIONS = [
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
  console.log(`👤 Seeding Admin account [${ADMIN_EMAIL}]...`);

  // 1. Ensure permissions exist
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: perm,
    });
  }
  const allPermissions = await prisma.permission.findMany();

  // 2. Find or Create Company
  const slug = COMPANY_NAME.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-hq";
  let company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: COMPANY_NAME,
        slug,
        description: `Primary workspace for ${COMPANY_NAME}`,
      },
    });
    console.log(`🏢 Created workspace company: ${company.name}`);
  }

  // 3. Find or Create COMPANY_ADMIN role
  let adminRole = await prisma.role.findFirst({
    where: { companyId: company.id, name: "COMPANY_ADMIN" },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: "COMPANY_ADMIN",
        displayName: "Company Administrator",
        description: "Full administrative access across all modules",
        isSystem: true,
        permissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });
    console.log(`🛡️ Created COMPANY_ADMIN role with full permissions.`);
  }

  // 4. Hash Password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 5. Create or Update User
  let user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        isSuperAdmin: true,
        jobTitle: "Administrator",
      },
    });
    console.log(`👑 Created Admin User: ${user.name} (${user.email})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isSuperAdmin: true,
      },
    });
    console.log(`👑 Updated existing user to Super Admin: ${user.email}`);
  }

  // 6. Connect Company Membership
  const existingMembership = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: user.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.companyMember.create({
      data: {
        companyId: company.id,
        userId: user.id,
        roleId: adminRole.id,
        status: "ACTIVE",
      },
    });
    console.log(`🔗 Associated admin with company role.`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ADMIN ACCOUNT READY FOR LOGIN:");
  console.log(`   Workspace: ${company.name}`);
  console.log(`   Email:     ${user.email}`);
  console.log(`   Password:  ${ADMIN_PASSWORD}`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed Admin Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
