import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
  console.log("🚀 Starting database seed...");

  // 1. Clear existing data in reverse order of foreign keys
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
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log("🧹 Cleaned database tables.");

  // 2. Create Permissions
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSION_DEFINITIONS) {
    const created = await prisma.permission.create({
      data: perm,
    });
    permissionMap.set(perm.code, created.id);
  }
  console.log(`✅ Created ${PERMISSION_DEFINITIONS.length} permissions.`);

  // 3. Create Demo Company
  const company = await prisma.company.create({
    data: {
      name: "Acme Global Technologies",
      slug: "acme-tech",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      description: "Enterprise software innovations and agile cloud solutions.",
      timezone: "America/New_York",
      workingDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
      workingHours: "09:00-18:00",
    },
  });
  console.log(`🏢 Created Company: ${company.name}`);

  // 4. Create Standard Roles for the Company
  const allPermIds = Array.from(permissionMap.values());
  const pmPermCodes = [
    "PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_EDIT", "PROJECT_ARCHIVE",
    "TASK_VIEW", "TASK_CREATE", "TASK_EDIT", "TASK_DELETE", "TASK_ASSIGN", "TASK_COMMENT", "TASK_ATTACH_FILE",
    "BUG_CREATE", "BUG_EDIT", "BUG_ASSIGN", "BUG_RESOLVE",
    "REQUEST_CREATE", "REQUEST_APPROVE",
    "REPORT_VIEW", "DOCUMENT_CREATE", "DOCUMENT_EDIT",
    "TIME_TRACKING_VIEW", "TIME_TRACKING_MANAGE",
    "EMPLOYEE_VIEW"
  ];
  const leadPermCodes = [
    "PROJECT_VIEW", "TASK_VIEW", "TASK_CREATE", "TASK_EDIT", "TASK_ASSIGN", "TASK_COMMENT", "TASK_ATTACH_FILE",
    "BUG_CREATE", "BUG_EDIT", "BUG_ASSIGN", "BUG_RESOLVE",
    "REQUEST_CREATE", "REQUEST_APPROVE",
    "REPORT_VIEW", "DOCUMENT_CREATE", "DOCUMENT_EDIT",
    "TIME_TRACKING_VIEW", "EMPLOYEE_VIEW"
  ];
  const empPermCodes = [
    "PROJECT_VIEW", "TASK_VIEW", "TASK_EDIT", "TASK_COMMENT", "TASK_ATTACH_FILE",
    "BUG_CREATE", "BUG_EDIT", "BUG_RESOLVE",
    "REQUEST_CREATE", "DOCUMENT_CREATE", "TIME_TRACKING_VIEW", "EMPLOYEE_VIEW"
  ];
  const clientPermCodes = [
    "PROJECT_VIEW", "TASK_VIEW", "BUG_CREATE", "DOCUMENT_CREATE"
  ];
  const guestPermCodes = [
    "PROJECT_VIEW", "TASK_VIEW"
  ];

  const roleDefinitions = [
    { name: "SUPER_ADMIN", displayName: "Super Administrator", description: "Global multi-tenant system administrator", isSystem: true, permIds: allPermIds },
    { name: "COMPANY_ADMIN", displayName: "Company Administrator", description: "Full administrative access within the company", isSystem: false, permIds: allPermIds },
    { name: "PROJECT_MANAGER", displayName: "Project Manager", description: "Manages projects, milestones, task allocations, and roadmaps", isSystem: false, permIds: pmPermCodes.map(c => permissionMap.get(c)!).filter(Boolean) },
    { name: "TEAM_LEAD", displayName: "Team Lead", description: "Leads a functional team, coordinates sprints, and conducts reviews", isSystem: false, permIds: leadPermCodes.map(c => permissionMap.get(c)!).filter(Boolean) },
    { name: "EMPLOYEE", displayName: "Employee / Contributor", description: "Standard company employee working on tasks, bugs, and requests", isSystem: false, permIds: empPermCodes.map(c => permissionMap.get(c)!).filter(Boolean) },
    { name: "CLIENT", displayName: "Client / External Stakeholder", description: "External collaborator with visibility into selected deliverables", isSystem: false, permIds: clientPermCodes.map(c => permissionMap.get(c)!).filter(Boolean) },
    { name: "GUEST", displayName: "Guest", description: "Restricted read-only viewer for shared items", isSystem: false, permIds: guestPermCodes.map(c => permissionMap.get(c)!).filter(Boolean) },
  ];

  const roleMap = new Map<string, string>();
  for (const r of roleDefinitions) {
    const createdRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: r.name,
        displayName: r.displayName,
        description: r.description,
        isSystem: r.isSystem,
        permissions: {
          create: r.permIds.map(pId => ({ permissionId: pId })),
        },
      },
    });
    roleMap.set(r.name, createdRole.id);
  }
  console.log(`🛡️ Configured ${roleDefinitions.length} roles with assigned permissions.`);

  // 5. Hash default password
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 6. Create Users
  const userSeeds = [
    {
      name: "Alex Morgan",
      email: "admin1@acme.com",
      jobTitle: "Chief Executive Officer & Co-Founder",
      phone: "+1 (555) 019-2831",
      bio: "Tech entrepreneur with 15+ years experience building scalable enterprise SaaS products.",
      skills: "Executive Leadership, Product Strategy, Cloud Architecture, Operations",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "COMPANY_ADMIN",
    },
    {
      name: "Sarah Connor",
      email: "admin2@acme.com",
      jobTitle: "Chief Technology Officer",
      phone: "+1 (555) 019-4822",
      bio: "Systems architect specializing in high-throughput distributed systems and security compliance.",
      skills: "Distributed Systems, PostgreSQL, Kubernetes, Cyber Security, Next.js",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      role: "COMPANY_ADMIN",
    },
    {
      name: "David Miller",
      email: "pm@acme.com",
      jobTitle: "Principal Project Manager",
      phone: "+1 (555) 019-7731",
      bio: "Agile & Scrum certified master orchestrating cross-functional teams and critical deliverables.",
      skills: "Agile, Scrum, Roadmapping, Resource Allocation, Jira/ClickUp, Risk Assessment",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: "PROJECT_MANAGER",
    },
    {
      name: "Marcus Vance",
      email: "lead1@acme.com",
      jobTitle: "Frontend Engineering Lead",
      phone: "+1 (555) 019-8839",
      bio: "UI/UX enthusiast and frontend engineer passionate about web performance and design systems.",
      skills: "React 19, Next.js, Tailwind CSS, TypeScript, WebGL, Design Systems",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "TEAM_LEAD",
    },
    {
      name: "Elena Rostova",
      email: "lead2@acme.com",
      jobTitle: "Backend Infrastructure Lead",
      phone: "+1 (555) 019-9942",
      bio: "Database tuning specialist and backend engineer with focus on API reliability.",
      skills: "Node.js, PostgreSQL, Prisma, Redis, GraphQL, Docker",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      role: "TEAM_LEAD",
    },
    {
      name: "James Wilson",
      email: "dev1@acme.com",
      jobTitle: "Senior Frontend Developer",
      phone: "+1 (555) 019-1122",
      bio: "Building responsive, accessible web applications with pixel-perfect attention to detail.",
      skills: "TypeScript, React, State Management, HTML5 Canvas, Animation",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      role: "EMPLOYEE",
    },
    {
      name: "Priya Patel",
      email: "dev2@acme.com",
      jobTitle: "Full-Stack Software Engineer",
      phone: "+1 (555) 019-3344",
      bio: "End-to-end feature developer working from PostgreSQL schemas to interactive React widgets.",
      skills: "Full-Stack, Next.js, REST APIs, Microservices, Testing",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      role: "EMPLOYEE",
    },
    {
      name: "Chloe Bennett",
      email: "qa1@acme.com",
      jobTitle: "Lead QA Automation Engineer",
      phone: "+1 (555) 019-5566",
      bio: "Ensuring zero regressions through automated end-to-end testing and performance audits.",
      skills: "Cypress, Playwright, Jest, QA Workflows, Bug Triage, Regression Testing",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: "EMPLOYEE",
    },
    {
      name: "Rachel Green",
      email: "hr1@acme.com",
      jobTitle: "Director of People & Culture",
      phone: "+1 (555) 019-7788",
      bio: "Empowering talent growth, workplace wellness, and operational organizational scaling.",
      skills: "Talent Acquisition, Employee Relations, Benefits, HR Policies, Culture",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      role: "EMPLOYEE",
    },
    {
      name: "Robert Sterling",
      email: "client@clientcorp.com",
      jobTitle: "VP of Digital Transformation at ClientCorp",
      phone: "+1 (555) 019-9900",
      bio: "Strategic partner observing project milestones and enterprise product integration.",
      skills: "Client Management, Enterprise Architecture, Vendor Relations",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      role: "CLIENT",
    },
  ];

  const userMap = new Map<string, any>();
  for (const u of userSeeds) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        avatar: u.avatar,
        phone: u.phone,
        jobTitle: u.jobTitle,
        bio: u.bio,
        skills: u.skills,
        isSuperAdmin: u.email === "admin1@acme.com",
      },
    });
    userMap.set(u.email, user);
  }
  console.log(`👥 Created ${userSeeds.length} users with hashed credentials.`);

  // 7. Create Departments
  const deptSeeds = [
    { name: "Engineering", description: "Core product development, cloud infrastructure, and DevOps", managerEmail: "admin2@acme.com" },
    { name: "Product & Design", description: "Product discovery, UX research, UI design, and agile roadmaps", managerEmail: "pm@acme.com" },
    { name: "Quality Assurance", description: "Automated regression testing, test suites, and bug verification", managerEmail: "qa1@acme.com" },
    { name: "Human Resources", description: "People operations, employee experience, and talent acquisition", managerEmail: "hr1@acme.com" },
    { name: "Sales & Marketing", description: "Revenue growth, enterprise sales, and developer marketing", managerEmail: "admin1@acme.com" },
  ];

  const deptMap = new Map<string, string>();
  for (const d of deptSeeds) {
    const mgr = userMap.get(d.managerEmail);
    const createdDept = await prisma.department.create({
      data: {
        companyId: company.id,
        name: d.name,
        description: d.description,
        managerId: mgr?.id,
      },
    });
    deptMap.set(d.name, createdDept.id);
  }
  console.log(`🏛️ Created ${deptSeeds.length} departments.`);

  // 8. Create Teams
  const teamSeeds = [
    { name: "Frontend Team", dept: "Engineering", leadEmail: "lead1@acme.com", desc: "Design system, Next.js web application, client-side state" },
    { name: "Backend Team", dept: "Engineering", leadEmail: "lead2@acme.com", desc: "API services, Prisma ORM queries, PostgreSQL database, caching" },
    { name: "Mobile Core Team", dept: "Engineering", leadEmail: "lead1@acme.com", desc: "Cross-platform React Native mobile applications" },
    { name: "QA & Reliability", dept: "Quality Assurance", leadEmail: "qa1@acme.com", desc: "End-to-end integration test suites and automated deployment checks" },
  ];

  const teamMap = new Map<string, string>();
  for (const t of teamSeeds) {
    const lead = userMap.get(t.leadEmail);
    const createdTeam = await prisma.team.create({
      data: {
        companyId: company.id,
        name: t.name,
        description: t.desc,
        departmentId: deptMap.get(t.dept),
        teamLeadId: lead?.id,
      },
    });
    teamMap.set(t.name, createdTeam.id);
  }
  console.log(`🤝 Created ${teamSeeds.length} teams.`);

  // 9. Link Users to Company as CompanyMembers
  const userTeamAssignments: Record<string, { dept: string; team?: string; role: string }> = {
    "admin1@acme.com": { dept: "Sales & Marketing", role: "COMPANY_ADMIN" },
    "admin2@acme.com": { dept: "Engineering", role: "COMPANY_ADMIN" },
    "pm@acme.com": { dept: "Product & Design", role: "PROJECT_MANAGER" },
    "lead1@acme.com": { dept: "Engineering", team: "Frontend Team", role: "TEAM_LEAD" },
    "lead2@acme.com": { dept: "Engineering", team: "Backend Team", role: "TEAM_LEAD" },
    "dev1@acme.com": { dept: "Engineering", team: "Frontend Team", role: "EMPLOYEE" },
    "dev2@acme.com": { dept: "Engineering", team: "Backend Team", role: "EMPLOYEE" },
    "qa1@acme.com": { dept: "Quality Assurance", team: "QA & Reliability", role: "EMPLOYEE" },
    "hr1@acme.com": { dept: "Human Resources", role: "EMPLOYEE" },
    "client@clientcorp.com": { dept: "Product & Design", role: "CLIENT" },
  };

  for (const [email, info] of Object.entries(userTeamAssignments)) {
    const user = userMap.get(email);
    const roleId = roleMap.get(info.role);
    if (user && roleId) {
      await prisma.companyMember.create({
        data: {
          companyId: company.id,
          userId: user.id,
          roleId: roleId,
          departmentId: deptMap.get(info.dept),
          teamId: info.team ? teamMap.get(info.team) : null,
          status: "ACTIVE",
          joiningDate: new Date("2024-01-15"),
        },
      });

      if (info.team && teamMap.get(info.team)) {
        await prisma.teamMember.create({
          data: {
            teamId: teamMap.get(info.team)!,
            userId: user.id,
            role: info.role === "TEAM_LEAD" ? "LEAD" : "MEMBER",
          },
        });
      }
    }
  }
  console.log(`🔗 Associated all company members with departments, teams, and RBAC roles.`);

  // 10. Create Tags
  const tagNames = [
    { name: "Frontend", color: "#3b82f6" },
    { name: "Backend", color: "#10b981" },
    { name: "Security", color: "#ef4444" },
    { name: "UI/UX", color: "#8b5cf6" },
    { name: "Database", color: "#f59e0b" },
    { name: "High-Priority", color: "#ec4899" },
  ];
  const tagMap = new Map<string, string>();
  for (const t of tagNames) {
    const createdTag = await prisma.tag.create({
      data: {
        companyId: company.id,
        name: t.name,
        color: t.color,
      },
    });
    tagMap.set(t.name, createdTag.id);
  }

  // 11. Create Projects
  const projectSeeds = [
    {
      name: "NextGen Cloud Platform",
      code: "CLOUD-X",
      description: "Scalable microservices migration and real-time dashboard analytics infrastructure.",
      status: "ACTIVE",
      priority: "HIGH",
      progress: 68,
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-11-30"),
      ownerEmail: "admin2@acme.com",
      managerEmail: "pm@acme.com",
      dept: "Engineering",
      team: "Backend Team",
      tags: ["Backend", "Database", "Security"],
      members: ["admin2@acme.com", "pm@acme.com", "lead2@acme.com", "dev2@acme.com", "qa1@acme.com"],
    },
    {
      name: "Customer Mobile App 2.0",
      code: "MOB-2",
      description: "Redesigned mobile experience with offline synchronization, biometric auth, and push notifications.",
      status: "ACTIVE",
      priority: "CRITICAL",
      progress: 42,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-09-15"),
      ownerEmail: "admin1@acme.com",
      managerEmail: "pm@acme.com",
      dept: "Engineering",
      team: "Frontend Team",
      tags: ["Frontend", "UI/UX", "High-Priority"],
      members: ["pm@acme.com", "lead1@acme.com", "dev1@acme.com", "qa1@acme.com", "client@clientcorp.com"],
    },
    {
      name: "SOC2 Security & Compliance Audit",
      code: "SEC-2026",
      description: "Comprehensive enterprise security framework, penetration testing, and ISO/SOC2 certification.",
      status: "PLANNING",
      priority: "MEDIUM",
      progress: 15,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-31"),
      ownerEmail: "admin2@acme.com",
      managerEmail: "pm@acme.com",
      dept: "Engineering",
      tags: ["Security", "Database"],
      members: ["admin2@acme.com", "pm@acme.com", "lead2@acme.com"],
    },
    {
      name: "AI Workflow Automation Suite",
      code: "AI-FLOW",
      description: "Internal autonomous agent pipelines for customer support ticket routing and automated bug reproduction.",
      status: "ACTIVE",
      priority: "HIGH",
      progress: 85,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-06-30"),
      ownerEmail: "admin1@acme.com",
      managerEmail: "pm@acme.com",
      dept: "Product & Design",
      team: "Frontend Team",
      tags: ["Frontend", "Backend", "High-Priority"],
      members: ["admin1@acme.com", "pm@acme.com", "dev1@acme.com", "dev2@acme.com"],
    },
  ];

  const projectMap = new Map<string, string>();
  for (const p of projectSeeds) {
    const owner = userMap.get(p.ownerEmail);
    const manager = userMap.get(p.managerEmail);
    const createdProj = await prisma.project.create({
      data: {
        companyId: company.id,
        name: p.name,
        code: p.code,
        description: p.description,
        status: p.status,
        priority: p.priority,
        progress: p.progress,
        startDate: p.startDate,
        endDate: p.endDate,
        ownerId: owner?.id,
        managerId: manager?.id,
        departmentId: deptMap.get(p.dept),
        teamId: p.team ? teamMap.get(p.team) : null,
      },
    });
    projectMap.set(p.code, createdProj.id);

    // Tags
    for (const tagName of p.tags) {
      const tagId = tagMap.get(tagName);
      if (tagId) {
        await prisma.projectTag.create({
          data: { projectId: createdProj.id, tagId },
        });
      }
    }

    // Members
    for (const memEmail of p.members) {
      const user = userMap.get(memEmail);
      if (user) {
        await prisma.projectMember.create({
          data: {
            projectId: createdProj.id,
            userId: user.id,
            role: memEmail === p.managerEmail ? "MANAGER" : "MEMBER",
          },
        });
      }
    }

    // Milestones
    await prisma.milestone.createMany({
      data: [
        {
          projectId: createdProj.id,
          title: "Phase 1: Architecture Sign-off",
          description: "Finalize technical requirements and database schemas",
          dueDate: new Date("2026-04-15"),
          status: "COMPLETED",
          completedAt: new Date("2026-04-12"),
        },
        {
          projectId: createdProj.id,
          title: "Phase 2: MVP Alpha Release",
          description: "Internal release for dogfooding and QA verification",
          dueDate: new Date("2026-07-30"),
          status: "PENDING",
        },
        {
          projectId: createdProj.id,
          title: "Phase 3: Production Go-Live",
          description: "High-availability deployment with canary traffic routing",
          dueDate: new Date("2026-10-15"),
          status: "PENDING",
        },
      ],
    });
  }
  console.log(`📁 Created ${projectSeeds.length} projects with milestones and members.`);

  // 12. Create Tasks with Subtasks, Checklists, and Comments
  const cloudProjId = projectMap.get("CLOUD-X")!;
  const mobProjId = projectMap.get("MOB-2")!;

  const task1 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Implement Distributed RBAC Authorization Engine",
      description: "Develop server-side permission validation interceptor with caching for high-speed tenant checking.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      reporterId: userMap.get("pm@acme.com")?.id,
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-10-05"),
      estimatedHours: 40,
      actualHours: 26,
      orderIndex: 0,
      assignees: {
        create: [
          { userId: userMap.get("lead2@acme.com")!.id },
          { userId: userMap.get("dev2@acme.com")!.id },
        ],
      },
      checklists: {
        create: [
          { title: "Define permission codes enum", isCompleted: true, orderIndex: 0 },
          { title: "Implement Prisma role-permission lookup", isCompleted: true, orderIndex: 1 },
          { title: "Add middleware JWT payload check", isCompleted: true, orderIndex: 2 },
          { title: "Write server actions authorization guards", isCompleted: false, orderIndex: 3 },
          { title: "Unit test cross-tenant boundary isolation", isCompleted: false, orderIndex: 4 },
        ],
      },
    },
  });

  // Subtasks for Task 1
  await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      parentTaskId: task1.id,
      title: "Server Action Guards & Error Handling",
      description: "Return standardized 403 Forbidden with user-friendly toast messages",
      status: "TODO",
      priority: "HIGH",
      reporterId: userMap.get("lead2@acme.com")?.id,
      estimatedHours: 12,
      orderIndex: 0,
      assignees: { create: [{ userId: userMap.get("dev2@acme.com")!.id }] },
    },
  });

  await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      parentTaskId: task1.id,
      title: "Role Hierarchy & Inheritance Schema",
      description: "Support COMPANY_ADMIN, PROJECT_MANAGER, and TEAM_LEAD roles seamlessly",
      status: "COMPLETED",
      priority: "MEDIUM",
      reporterId: userMap.get("lead2@acme.com")?.id,
      estimatedHours: 14,
      actualHours: 14,
      orderIndex: 1,
      assignees: { create: [{ userId: userMap.get("lead2@acme.com")!.id }] },
    },
  });

  // Comments on Task 1
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task1.id,
        authorId: userMap.get("lead2@acme.com")!.id,
        content: "I have structured the database schema to ensure companyId is strictly queried in every relation. @Elena please review the PR.",
        createdAt: new Date("2026-09-20T10:30:00Z"),
      },
      {
        taskId: task1.id,
        authorId: userMap.get("pm@acme.com")!.id,
        content: "Great progress! Let's ensure this is thoroughly tested before our client demo next Tuesday.",
        createdAt: new Date("2026-09-21T14:15:00Z"),
      },
    ],
  });

  // More tasks across different statuses
  const task2 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Design PostgreSQL Connection Pooler & Caching Layer",
      description: "Set up Prisma query pooling and Redis cache strategy for read-heavy dashboard endpoints.",
      status: "BACKLOG",
      priority: "HIGH",
      reporterId: userMap.get("admin2@acme.com")?.id,
      dueDate: new Date("2026-11-01"),
      estimatedHours: 24,
      orderIndex: 1,
      assignees: { create: [{ userId: userMap.get("lead2@acme.com")!.id }] },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: mobProjId,
      title: "Interactive Kanban Board with Drag & Drop",
      description: "Implement fluid drag-and-drop task movements that persist immediately to PostgreSQL.",
      status: "IN_REVIEW",
      priority: "URGENT",
      reporterId: userMap.get("pm@acme.com")?.id,
      startDate: new Date("2026-09-12"),
      dueDate: new Date("2026-09-28"),
      estimatedHours: 32,
      actualHours: 30,
      orderIndex: 0,
      assignees: {
        create: [
          { userId: userMap.get("lead1@acme.com")!.id },
          { userId: userMap.get("dev1@acme.com")!.id },
        ],
      },
      checklists: {
        create: [
          { title: "HTML5 Drag and Drop handlers", isCompleted: true, orderIndex: 0 },
          { title: "Optimistic UI state update", isCompleted: true, orderIndex: 1 },
          { title: "PostgreSQL mutation endpoint", isCompleted: true, orderIndex: 2 },
          { title: "Error rollback toast notification", isCompleted: true, orderIndex: 3 },
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: mobProjId,
      title: "Implement Biometric Auth (FaceID / Fingerprint)",
      description: "Secure local token storage with native biometric prompt fallback to PIN.",
      status: "BLOCKED",
      priority: "MEDIUM",
      reporterId: userMap.get("lead1@acme.com")?.id,
      dueDate: new Date("2026-10-10"),
      estimatedHours: 20,
      actualHours: 8,
      orderIndex: 1,
      assignees: { create: [{ userId: userMap.get("dev1@acme.com")!.id }] },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: mobProjId,
      title: "Dark Mode Theme Engine with System Sync",
      description: "Persistent theme toggle supporting light, dark, and system preference with zero flash of unstyled content.",
      status: "COMPLETED",
      priority: "LOW",
      reporterId: userMap.get("pm@acme.com")?.id,
      startDate: new Date("2026-08-15"),
      dueDate: new Date("2026-09-01"),
      estimatedHours: 16,
      actualHours: 14,
      orderIndex: 2,
      assignees: { create: [{ userId: userMap.get("dev1@acme.com")!.id }] },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Export Company Audit Logs to CSV / JSON",
      description: "Allow company administrators to export chronological activity and security event logs.",
      status: "TODO",
      priority: "MEDIUM",
      reporterId: userMap.get("admin1@acme.com")?.id,
      dueDate: new Date("2026-10-20"),
      estimatedHours: 16,
      orderIndex: 2,
      assignees: { create: [{ userId: userMap.get("dev2@acme.com")!.id }] },
    },
  });

  console.log(`📋 Created tasks across all 6 statuses (Backlog, Todo, In Progress, In Review, Blocked, Completed).`);

  // 13. Create Dedicated Bugs
  const bug1 = await prisma.bug.create({
    data: {
      companyId: company.id,
      projectId: mobProjId,
      title: "Session token expires prematurely during active document uploads",
      description: "When uploading files larger than 15MB on slower 3G connections, the auth cookie token refreshes mid-stream causing upload abort.",
      severity: "HIGH",
      priority: "URGENT",
      status: "IN_PROGRESS",
      environment: "Production Staging",
      browserDevice: "Chrome Mobile on iOS 18.2",
      stepsToReproduce: "1. Log in on mobile.\n2. Navigate to Documents -> Upload.\n3. Select a 25MB PDF.\n4. Throttle network to Slow 3G in devtools.\n5. Wait 90 seconds.",
      expectedResult: "Upload resumes smoothly with background token refresh.",
      actualResult: "401 Unauthorized returned and file upload is aborted.",
      reporterId: userMap.get("qa1@acme.com")?.id,
      assignedDevId: userMap.get("dev1@acme.com")?.id,
      qaTesterId: userMap.get("qa1@acme.com")?.id,
    },
  });

  const bug2 = await prisma.bug.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Kanban column card count badge does not decrement upon task deletion",
      description: "Deleting a task from the modal leaves the column header count unchanged until a full page reload.",
      severity: "LOW",
      priority: "LOW",
      status: "REOPENED",
      environment: "Development Localhost",
      browserDevice: "Desktop Firefox 131",
      stepsToReproduce: "1. Open Kanban view.\n2. Note 'In Progress (3)'.\n3. Click task card -> Delete.\n4. Check header count.",
      expectedResult: "Header counter updates immediately to (2).",
      actualResult: "Counter remains at (3) until browser refresh.",
      reporterId: userMap.get("qa1@acme.com")?.id,
      assignedDevId: userMap.get("dev2@acme.com")?.id,
      qaTesterId: userMap.get("qa1@acme.com")?.id,
    },
  });

  const bug3 = await prisma.bug.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Crash on date filter selection with inverted start/end dates",
      description: "Setting start date after end date causes unhandled runtime exception in reports table.",
      severity: "MEDIUM",
      priority: "MEDIUM",
      status: "FIXED",
      environment: "Staging",
      browserDevice: "Safari 18",
      stepsToReproduce: "1. Go to Reports.\n2. Set Start: Oct 30, End: Oct 01.\n3. Click Filter.",
      expectedResult: "Validation message 'Start date must be before end date'.",
      actualResult: "Page crashed with RangeError.",
      reporterId: userMap.get("pm@acme.com")?.id,
      assignedDevId: userMap.get("lead2@acme.com")?.id,
      qaTesterId: userMap.get("qa1@acme.com")?.id,
      resolvedAt: new Date("2026-09-22"),
    },
  });

  console.log(`🐞 Created dedicated bug records with full reproduction steps and QA workflows.`);

  // 14. Create Internal Requests and Multi-step Approvals
  const req1 = await prisma.request.create({
    data: {
      companyId: company.id,
      requesterId: userMap.get("dev1@acme.com")!.id,
      type: "LEAVE",
      subject: "Annual Family Vacation (5 days)",
      description: "Requesting paid annual leave from Oct 12 to Oct 16. Handover completed with @dev2.",
      priority: "MEDIUM",
      status: "APPROVED",
      assignedDepartmentId: deptMap.get("Human Resources"),
      assignedEmployeeId: userMap.get("hr1@acme.com")?.id,
      createdAt: new Date("2026-09-18"),
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        requestId: req1.id,
        approverId: userMap.get("lead1@acme.com")!.id,
        step: "MANAGER_REVIEW",
        status: "APPROVED",
        comments: "Sprint coverage confirmed. Approved by engineering lead.",
        approvedAt: new Date("2026-09-19T09:00:00Z"),
      },
      {
        requestId: req1.id,
        approverId: userMap.get("hr1@acme.com")!.id,
        step: "ADMIN_HR_REVIEW",
        status: "APPROVED",
        comments: "PTO balance verified. Approved in HR systems.",
        approvedAt: new Date("2026-09-20T11:00:00Z"),
      },
    ],
  });

  const req2 = await prisma.request.create({
    data: {
      companyId: company.id,
      requesterId: userMap.get("dev2@acme.com")!.id,
      type: "EQUIPMENT",
      subject: "Hardware Upgrade: MacBook Pro 16\" (M3 Max, 64GB RAM)",
      description: "Current machine struggles with running local Docker microservices and parallel Next.js builds.",
      priority: "HIGH",
      status: "UNDER_REVIEW",
      assignedDepartmentId: deptMap.get("Engineering"),
      assignedEmployeeId: userMap.get("admin2@acme.com")?.id,
      createdAt: new Date("2026-09-24"),
    },
  });

  await prisma.approval.create({
    data: {
      requestId: req2.id,
      approverId: userMap.get("lead2@acme.com")!.id,
      step: "MANAGER_REVIEW",
      status: "APPROVED",
      comments: "Technical justification verified. Forwarded to CTO for budget sign-off.",
      approvedAt: new Date("2026-09-25T14:30:00Z"),
    },
  });

  const req3 = await prisma.request.create({
    data: {
      companyId: company.id,
      requesterId: userMap.get("qa1@acme.com")!.id,
      type: "WORK_FROM_HOME",
      subject: "Remote Sprint Week for Deep Automated Test Writing",
      description: "Requesting full remote presence next week for focused test suite migration.",
      priority: "LOW",
      status: "PENDING",
      assignedDepartmentId: deptMap.get("Quality Assurance"),
      createdAt: new Date("2026-09-26"),
    },
  });

  console.log(`📝 Created internal requests and approval workflow audit trails.`);

  // 15. Create Time Tracking Entries
  await prisma.timeEntry.createMany({
    data: [
      {
        companyId: company.id,
        userId: userMap.get("lead2@acme.com")!.id,
        projectId: cloudProjId,
        taskId: task1.id,
        durationMinutes: 180,
        notes: "Drafted database schema and tenant isolation queries",
        date: new Date("2026-09-22"),
        isBillable: true,
      },
      {
        companyId: company.id,
        userId: userMap.get("dev2@acme.com")!.id,
        projectId: cloudProjId,
        taskId: task1.id,
        durationMinutes: 240,
        notes: "Implemented RBAC permission checks in API route handlers",
        date: new Date("2026-09-23"),
        isBillable: true,
      },
      {
        companyId: company.id,
        userId: userMap.get("dev1@acme.com")!.id,
        projectId: mobProjId,
        taskId: task3.id,
        durationMinutes: 210,
        notes: "Configured drag-and-drop HTML5 event handlers and drop zones",
        date: new Date("2026-09-24"),
        isBillable: true,
      },
      {
        companyId: company.id,
        userId: userMap.get("qa1@acme.com")!.id,
        projectId: mobProjId,
        durationMinutes: 120,
        notes: "Mobile browser regression testing on Safari and Chrome iOS",
        date: new Date("2026-09-25"),
        isBillable: true,
      },
    ],
  });
  console.log(`⏱️ Logged time tracking entries.`);

  // 16. Create Meetings
  const meeting1 = await prisma.meeting.create({
    data: {
      companyId: company.id,
      projectId: cloudProjId,
      title: "Sprint 14 Architecture & Security Review",
      description: "Bi-weekly technical sync on multi-tenant database scaling, index optimization, and security boundaries.",
      organizerId: userMap.get("admin2@acme.com")!.id,
      date: new Date("2026-09-29"),
      startTime: "10:00",
      endTime: "11:30",
      meetingUrl: "https://meet.google.com/xyz-proj-sync",
      location: "Virtual & Conference Room Alpha",
      notes: "Agenda: 1. Review Prisma indices. 2. Tenant isolation audits. 3. Open bugs triage.",
      participants: {
        create: [
          { userId: userMap.get("admin2@acme.com")!.id, status: "ACCEPTED" },
          { userId: userMap.get("pm@acme.com")!.id, status: "ACCEPTED" },
          { userId: userMap.get("lead2@acme.com")!.id, status: "ACCEPTED" },
          { userId: userMap.get("dev2@acme.com")!.id, status: "ACCEPTED" },
        ],
      },
    },
  });

  const meeting2 = await prisma.meeting.create({
    data: {
      companyId: company.id,
      projectId: mobProjId,
      title: "Mobile App 2.0 Client Stakeholder Demo",
      description: "Demonstrating the new Kanban boards, offline data caching, and dark mode interface.",
      organizerId: userMap.get("pm@acme.com")!.id,
      date: new Date("2026-10-02"),
      startTime: "15:00",
      endTime: "16:00",
      meetingUrl: "https://meet.google.com/mob-client-demo",
      location: "Executive Boardroom",
      participants: {
        create: [
          { userId: userMap.get("pm@acme.com")!.id, status: "ACCEPTED" },
          { userId: userMap.get("lead1@acme.com")!.id, status: "ACCEPTED" },
          { userId: userMap.get("client@clientcorp.com")!.id, status: "ACCEPTED" },
        ],
      },
    },
  });
  console.log(`📅 Created calendar meetings.`);

  // 17. Create Documents
  await prisma.document.createMany({
    data: [
      {
        companyId: company.id,
        projectId: cloudProjId,
        title: "Enterprise Multi-Tenant Architecture Blueprint",
        description: "Comprehensive technical specifications detailing tenant database isolation and permission matrices.",
        fileUrl: "/docs/cloud-architecture-v2.pdf",
        fileType: "application/pdf",
        fileSize: 4200000,
        createdById: userMap.get("admin2@acme.com")!.id,
      },
      {
        companyId: company.id,
        departmentId: deptMap.get("Human Resources"),
        title: "Acme 2026 Employee Handbook & Benefits Guide",
        description: "Official internal policies, leave entitlements, remote work guidelines, and career development tracks.",
        fileUrl: "/docs/employee-handbook-2026.pdf",
        fileType: "application/pdf",
        fileSize: 2800000,
        createdById: userMap.get("hr1@acme.com")!.id,
      },
      {
        companyId: company.id,
        projectId: mobProjId,
        title: "Mobile App 2.0 Figma Design Tokens & Specifications",
        description: "Design system tokens, typography scales, color palettes, and component states.",
        fileUrl: "/docs/mobile-design-specs.pdf",
        fileType: "application/pdf",
        fileSize: 8500000,
        createdById: userMap.get("lead1@acme.com")!.id,
      },
    ],
  });
  console.log(`📄 Created company documents.`);

  // 18. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        companyId: company.id,
        userId: userMap.get("dev1@acme.com")!.id,
        title: "Task Assigned",
        message: "You have been assigned to 'Interactive Kanban Board with Drag & Drop'.",
        type: "TASK_ASSIGNED",
        entityType: "task",
        entityId: task3.id,
        isRead: false,
      },
      {
        companyId: company.id,
        userId: userMap.get("dev1@acme.com")!.id,
        title: "Leave Request Approved",
        message: "Your leave request for 5 days in October has been approved by HR.",
        type: "REQUEST_STATUS",
        entityType: "request",
        entityId: req1.id,
        isRead: true,
      },
      {
        companyId: company.id,
        userId: userMap.get("admin1@acme.com")!.id,
        title: "New Equipment Request Pending",
        message: "Priya Patel submitted an equipment request for a MacBook Pro M3 Max.",
        type: "REQUEST_STATUS",
        entityType: "request",
        entityId: req2.id,
        isRead: false,
      },
      {
        companyId: company.id,
        userId: userMap.get("lead2@acme.com")!.id,
        title: "Bug Assigned",
        message: "Bug 'Session token expires prematurely during active document uploads' assigned to your team.",
        type: "BUG_ASSIGNED",
        entityType: "bug",
        entityId: bug1.id,
        isRead: false,
      },
    ],
  });
  console.log(`🔔 Created sample user notifications.`);

  // 19. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        actorId: userMap.get("admin1@acme.com")!.id,
        action: "COMPANY_INITIALIZED",
        entityType: "Company",
        entityId: company.id,
        description: "Initialized Acme Global Technologies enterprise workspace and security boundaries.",
        ipAddress: "192.168.1.10",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0",
        createdAt: new Date("2026-01-10T08:00:00Z"),
      },
      {
        companyId: company.id,
        actorId: userMap.get("admin2@acme.com")!.id,
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: cloudProjId,
        description: "Created project 'NextGen Cloud Platform' (CLOUD-X) with high priority.",
        ipAddress: "192.168.1.15",
        createdAt: new Date("2026-01-10T09:30:00Z"),
      },
      {
        companyId: company.id,
        actorId: userMap.get("pm@acme.com")!.id,
        action: "TASK_CREATED",
        entityType: "Task",
        entityId: task1.id,
        description: "Created task 'Implement Distributed RBAC Authorization Engine'.",
        ipAddress: "192.168.1.22",
        createdAt: new Date("2026-09-01T11:00:00Z"),
      },
      {
        companyId: company.id,
        actorId: userMap.get("hr1@acme.com")!.id,
        action: "REQUEST_APPROVED",
        entityType: "Request",
        entityId: req1.id,
        description: "Approved PTO leave request for James Wilson.",
        ipAddress: "192.168.1.40",
        createdAt: new Date("2026-09-20T11:00:00Z"),
      },
    ],
  });
  console.log(`📜 Generated initial audit logs.`);

  console.log("\n✨ Database seed successfully completed!");
  console.log("=========================================================");
  console.log("DEMO CREDENTIALS (password: password123 for all users):");
  console.log("🏢 Company: Acme Global Technologies");
  console.log("👑 Company Admin 1: admin1@acme.com (CEO / Super Admin)");
  console.log("👑 Company Admin 2: admin2@acme.com (CTO)");
  console.log("📊 Project Manager: pm@acme.com");
  console.log("💻 Team Lead 1 (Frontend): lead1@acme.com");
  console.log("💻 Team Lead 2 (Backend): lead2@acme.com");
  console.log("👨‍💻 Employee (Frontend Dev): dev1@acme.com");
  console.log("👩‍💻 Employee (Full-Stack Dev): dev2@acme.com");
  console.log("🔍 QA Automation Lead: qa1@acme.com");
  console.log("🤝 HR Director: hr1@acme.com");
  console.log("🌐 Client Representative: client@clientcorp.com");
  console.log("=========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
