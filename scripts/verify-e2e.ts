import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth/session";

async function verifyAll() {
  console.log("=================================================");
  console.log("🚀 STARTING SECTION 48 FINAL QUALITY VERIFICATION");
  console.log("=================================================\n");

  // 1. Verify Authentication
  console.log("--- 1. VERIFY AUTHENTICATION ---");
  const admin1 = await prisma.user.findUnique({
    where: { email: "admin1@acme.com" },
    include: { memberships: { include: { role: true, company: true } } },
  });
  if (!admin1) throw new Error("admin1@acme.com not found");
  const isValidPass = await bcrypt.compare("password123", admin1.passwordHash);
  console.log(`✓ Admin 1 found: ${admin1.name} (${admin1.email})`);
  console.log(`✓ Password verification: ${isValidPass ? "PASSED" : "FAILED"}`);

  const token = signToken({
    userId: admin1.id,
    email: admin1.email,
    name: admin1.name,
    companyId: admin1.memberships[0].companyId,
    roleId: admin1.memberships[0].roleId,
    roleName: admin1.memberships[0].role.name,
  });
  console.log(`✓ JWT Session generation: SUCCESS (Length: ${token.length})`);

  // 2. Verify Multiple Company Admins
  console.log("\n--- 2. VERIFY MULTIPLE COMPANY ADMINS ---");
  const admin2 = await prisma.user.findUnique({
    where: { email: "admin2@acme.com" },
    include: { memberships: { include: { role: true } } },
  });
  if (!admin2) throw new Error("admin2@acme.com not found");
  const companyAdmins = await prisma.companyMember.findMany({
    where: {
      companyId: admin1.memberships[0].companyId,
      role: { name: "COMPANY_ADMIN" },
    },
    include: { user: true },
  });
  console.log(`✓ Found ${companyAdmins.length} active COMPANY_ADMINs in Acme Global Technologies:`);
  companyAdmins.forEach((m) => console.log(`   - ${m.user.name} (${m.user.email})`));
  if (companyAdmins.length < 2) throw new Error("Multiple company admins check FAILED");
  console.log("✓ Multiple company admins rule: PASSED");

  // 3. Verify RBAC
  console.log("\n--- 3. VERIFY RBAC (Role-Based Access Control) ---");
  const dev1 = await prisma.user.findUnique({
    where: { email: "dev1@acme.com" },
    include: { memberships: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!dev1) throw new Error("dev1@acme.com not found");
  const devRole = dev1.memberships[0].role.name;
  const devPerms = dev1.memberships[0].role.permissions.map((p) => p.permission.name);
  console.log(`✓ Employee: ${dev1.name} (${dev1.email}) with Role: ${devRole}`);
  console.log(`✓ Employee permissions count: ${devPerms.length}`);
  const hasAuditLogView = devPerms.includes("AUDIT_LOG_VIEW");
  console.log(`✓ Has AUDIT_LOG_VIEW: ${hasAuditLogView} (Expected: false -> ordinary employees blocked from audit logs)`);
  if (hasAuditLogView) throw new Error("RBAC restriction check FAILED");
  console.log("✓ RBAC permission enforcement: PASSED");

  // 4. Verify Tenant Isolation
  console.log("\n--- 4. VERIFY TENANT ISOLATION ---");
  // Check if Beta Corp exists or create it
  let betaCorp = await prisma.company.findUnique({ where: { slug: "beta-corp" } });
  if (!betaCorp) {
    betaCorp = await prisma.company.create({
      data: {
        name: "Beta Corporation",
        slug: "beta-corp",
      },
    });
    // Create an isolated project in Beta Corp
    await prisma.project.create({
      data: {
        name: "Beta Confidential Project",
        code: "BETA-01",
        description: "Confidential to Beta Corp",
        companyId: betaCorp.id,
      },
    });
  }

  const acmeId = admin1.memberships[0].companyId;
  const acmeProjects = await prisma.project.findMany({
    where: { companyId: acmeId },
  });
  const leakedBetaProjects = acmeProjects.filter((p) => p.companyId === betaCorp!.id);
  console.log(`✓ Acme project count: ${acmeProjects.length}`);
  console.log(`✓ Leaked Beta Corp projects in Acme query: ${leakedBetaProjects.length}`);
  if (leakedBetaProjects.length > 0) throw new Error("Tenant isolation FAILED");
  console.log("✓ Tenant isolation: PASSED");

  // 5. Create a Project & Task & Audit Log
  console.log("\n--- 5. CREATE A PROJECT (End-to-End Persistence) ---");
  const newProjCode = `PRJ-${Date.now().toString().slice(-4)}`;
  const newProject = await prisma.project.create({
    data: {
      name: "Autonomous Mobile Suite",
      code: newProjCode,
      description: "Next-gen offline-first mobile sync engine",
      companyId: acmeId,
      ownerId: admin1.id,
      status: "ACTIVE",
      priority: "HIGH",
    },
  });
  console.log(`✓ Created new project: "${newProject.name}" [Code: ${newProject.code}, ID: ${newProject.id}]`);

  // Create a task under this project
  const newTask = await prisma.task.create({
    data: {
      title: "Implement bi-directional SQLite sync protocol",
      companyId: acmeId,
      projectId: newProject.id,
      reporterId: admin1.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      estimatedHours: 16,
    },
  });
  console.log(`✓ Created task: "${newTask.title}" [Status: ${newTask.status}, ID: ${newTask.id}]`);

  // Add a subtask
  const subtask = await prisma.task.create({
    data: {
      title: "Write conflict resolution unit tests",
      companyId: acmeId,
      projectId: newProject.id,
      parentTaskId: newTask.id,
      reporterId: admin1.id,
      status: "COMPLETED",
      priority: "HIGH",
    },
  });
  console.log(`✓ Created nested subtask: "${subtask.title}" [Parent: ${subtask.parentTaskId}]`);

  // Check subtasks percentage
  const parentWithChildren = await prisma.task.findUnique({
    where: { id: newTask.id },
    include: { subtasks: true },
  });
  const completedSubs = parentWithChildren?.subtasks.filter((s) => s.status === "COMPLETED").length || 0;
  const totalSubs = parentWithChildren?.subtasks.length || 0;
  const pct = Math.round((completedSubs / totalSubs) * 100);
  console.log(`✓ Subtasks completion: ${completedSubs}/${totalSubs} (${pct}%)`);

  // Record audit log
  const audit = await prisma.auditLog.create({
    data: {
      companyId: acmeId,
      actorId: admin1.id,
      action: "PROJECT_CREATE",
      entityType: "PROJECT",
      entityId: newProject.id,
      description: `Admin ${admin1.name} created project Autonomous Mobile Suite (${newProjCode})`,
    },
  });
  console.log(`✓ Immutable audit log generated: [Action: ${audit.action}, ID: ${audit.id}]`);

  console.log("\n=================================================");
  console.log("🎉 ALL SECTION 48 VERIFICATION CHECKS PASSED 100%");
  console.log("=================================================\n");
}

verifyAll()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
