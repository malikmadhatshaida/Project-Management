# Enterprise Project Management & Operations Platform

> A complete, production-ready business project management and internal company operations platform inspired by ClickUp, built with Next.js (App Router), Prisma, PostgreSQL/SQLite, TypeScript, Tailwind CSS, Lucide icons, Recharts, and Zod.

---

## 1. Project Overview

This platform is a multi-tenant, full-stack enterprise operations system designed for modern companies. It unifies project management, bug tracking with QA verification workflows, nested subtasks and checklists, internal approval workflows, real-time stopwatch time tracking, documents, calendar scheduling, role-based access control (RBAC), database notifications, and immutable compliance audit logs into a single interface with dark mode and zero fake/mock data.

---

## 2. Key Features

- **Multi-Company Architecture & Tenant Isolation:** Complete tenant isolation ensures Company A can never access Company B's projects, tasks, bugs, or employee data. Every query validates tenant boundaries server-side.
- **Enterprise RBAC & Permission System:** 7 distinct system and organization roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `PROJECT_MANAGER`, `TEAM_LEAD`, `EMPLOYEE`, `CLIENT`, `GUEST`) backed by 40+ granular permissions.
- **Multi-Company Admin Support:** Organizations can designate multiple `COMPANY_ADMIN` users simultaneously.
- **Hierarchical Company Structure:** Company &rarr; Departments &rarr; Teams &rarr; Employees &rarr; Projects.
- **Flexible Project Views:**
  - **List View:** Searchable, sortable overview of tasks with assignees, priorities, and statuses.
  - **Kanban Board:** Smooth HTML5 drag-and-drop between columns (*Backlog, To Do, In Progress, In Review, Blocked, Completed*) with **direct database persistence**.
  - **Gantt / Timeline View:** Visual bar schedule tracking task start dates, due dates, and completion status.
  - **Bugs View:** Integrated bug tracking tab directly within project context.
  - **Documents View:** Project-associated documentation and asset management.
- **Nested Subtasks & Checklists:**
  - Tasks support nested subtasks with real-time percentage completion calculation.
  - Checklists with instant toggle state persistence.
- **Real-Time Task Comments & Mentions:**
  - Discussion threads on every task.
  - `@username` mention detection that triggers instant in-app database notifications.
  - Ability to edit/delete own comments with audit logging.
- **Bug & Issue Management (QA Workflow):**
  - Dedicated bug tracking with reproduction steps, environment details, severity levels (*Low, Medium, High, Critical*), and statuses (*Open, Assigned, In Progress, Fixed, Ready for Testing, Verified, Reopened, Closed*).
  - QA tester verification workflow with explicit reopen capability.
- **Internal Request & Multi-Step Approvals:**
  - Standardized employee requests (*Leave, IT Support, Equipment, HR Request, Work From Home, Access Request, General*).
  - Multi-tier approval system (*Employee Submission &rarr; Manager Review &rarr; Admin/HR Approval/Rejection*) with complete audit history and automatic requester notification.
- **Employee Directory & Workload:**
  - Detailed profiles, department and team assignments, active task load tracking, and invitation workflow.
- **Live Stopwatch & Time Tracking:**
  - Global floating stopwatch widget with live tick count, task/project association, billable hours toggle, and manual entry logs.
- **Unified Enterprise Calendar:**
  - Monthly schedule aggregating task deadlines, project end-dates, and team meetings.
- **Meetings & Video Calls:**
  - Schedule meetings with participants, date/time, and virtual meeting links (Google Meet, Zoom, Teams).
- **Documents & File Management:**
  - File upload engine with metadata, download, preview, and project association.
- **Global Tenant Search (Ctrl + K):**
  - Search across projects, tasks, employees, teams, departments, bugs, and documents with tenant and permission boundary enforcement.
- **Reporting & Business Analytics:**
  - Recharts-powered graphs for task distribution, project health, employee workload, and department allocation.
  - **One-click CSV Export** for project and task reports.
- **Immutable Audit Logging:**
  - Automatic audit records capturing actor, action, entity type, entity ID, description, IP address, and timestamp.
  - Protected from standard employee viewing (restricted to Company Administrators).
- **Aesthetic UI / UX:**
  - Dark mode and light mode with system preference detection and localStorage persistence.
  - Responsive layout (mobile collapsible drawer, responsive cards).
  - Confetti celebrations when tasks or milestones reach 100% completion.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Data Visualization** | Recharts |
| **Validation** | Zod v4 |
| **Database ORM** | Prisma ORM v6.4.1 |
| **Database** | PostgreSQL (Production) / SQLite (Zero-Config Local Dev) |
| **Authentication** | Secure JWT with `httpOnly`, `SameSite=Lax` Cookie Sessions, `bcryptjs` hashing |
| **Audit & Events** | Prisma Middleware / Event Hooks for mandatory audit trails |

---

## 4. System Requirements

- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Database**:
  - **Local Development**: Built-in SQLite (`prisma/dev.db`, zero external database install required).
  - **Production**: PostgreSQL 14, 15, or 16.

---

## 5. Quick Start (Zero-Config Development)

1. **Clone & Install Dependencies:**
   ```bash
   git clone <repository-url>
   cd project-management
   npm install
   ```

2. **Environment Setup:**
   The repository includes a ready-to-run `.env` file configured for local SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="project_management_super_secret_jwt_key_2026_production_grade"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Initialize Database & Seed Data:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 6. Pre-Seeded Demo User Accounts

The database comes fully seeded with demo data for **Acme Global Technologies**:

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Company Admin 1** | `admin1@acme.com` | `password123` | Full company control, audit logs, billing, settings |
| **Company Admin 2** | `admin2@acme.com` | `password123` | Full company control (verifies multi-admin rule) |
| **Project Manager** | `pm@acme.com` | `password123` | Create projects, assign tasks, milestones, reports |
| **Team Lead** | `lead1@acme.com` | `password123` | Team management, task approvals, code reviews |
| **Senior Frontend Dev** | `dev1@acme.com` | `password123` | Assigned tasks, comments, time tracking, requests |
| **Backend Developer** | `dev2@acme.com` | `password123` | Assigned tasks, subtasks, checklists, documents |
| **QA Engineer** | `qa1@acme.com` | `password123` | Bug verification, reopen issues, testing tasks |
| **HR Specialist** | `hr@acme.com` | `password123` | Leave request approvals, department directory |
| **Client Representative** | `client@clientcorp.com` | `password123` | Client portal, view explicitly shared projects |
| **Guest User** | `guest@partner.com` | `password123` | Read-only restricted guest access |

---

## 7. PostgreSQL Setup & Switching Guide

To switch from the local SQLite engine to a production PostgreSQL database:

1. **Update `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/project_management?schema=public"
   ```

2. **Switch Prisma Schema:**
   Copy the provided PostgreSQL schema template over `prisma/schema.prisma`:
   ```bash
   # Windows PowerShell
   Copy-Item prisma/schema.postgresql.prisma prisma/schema.prisma
   ```

3. **Run Prisma Migrations & Seed:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

---

## 8. Role-Based Access Control (RBAC) Architecture

The application enforces server-side authorization through `src/lib/permissions/rbac.ts`.

### Built-In Roles
1. **`SUPER_ADMIN`**: Global system administrator across all tenants.
2. **`COMPANY_ADMIN`**: Complete administrative control of the tenant organization. Can invite employees, configure roles, approve requests, and inspect audit logs.
3. **`PROJECT_MANAGER`**: Can create and edit projects, assign team members, manage milestones, and track deadlines.
4. **`TEAM_LEAD`**: Manages team tasks, reviews code and work progress, and oversees sub-teams.
5. **`EMPLOYEE`**: Everyday contributor. Can update assigned tasks, toggle checklists, log time, report bugs, and submit internal requests.
6. **`CLIENT`**: External customer role. Strictly limited to projects and milestones where explicitly granted access.
7. **`GUEST`**: Read-only access to specific shared tasks or documents.

### Key Permissions List (40 Granular Keys)
- `COMPANY_VIEW`, `COMPANY_EDIT`, `COMPANY_SETTINGS_MANAGE`
- `EMPLOYEE_VIEW`, `EMPLOYEE_CREATE`, `EMPLOYEE_EDIT`, `EMPLOYEE_DELETE`, `EMPLOYEE_INVITE`
- `DEPARTMENT_CREATE`, `DEPARTMENT_EDIT`, `DEPARTMENT_DELETE`
- `TEAM_CREATE`, `TEAM_EDIT`, `TEAM_DELETE`
- `PROJECT_VIEW`, `PROJECT_CREATE`, `PROJECT_EDIT`, `PROJECT_DELETE`, `PROJECT_ARCHIVE`
- `TASK_VIEW`, `TASK_CREATE`, `TASK_EDIT`, `TASK_DELETE`, `TASK_ASSIGN`, `TASK_COMMENT`, `TASK_ATTACH_FILE`
- `BUG_CREATE`, `BUG_EDIT`, `BUG_ASSIGN`, `BUG_RESOLVE`
- `REQUEST_CREATE`, `REQUEST_APPROVE`, `REQUEST_REJECT`
- `REPORT_VIEW`, `AUDIT_LOG_VIEW`
- `DOCUMENT_CREATE`, `DOCUMENT_EDIT`, `DOCUMENT_DELETE`
- `TIME_TRACKING_VIEW`, `TIME_TRACKING_MANAGE`

---

## 9. Database Architecture (Entity Overview)

The database consists of 28 normalized models with strict foreign keys, cascading deletion rules, and indexing for high-frequency queries (`companyId`, `userId`, `projectId`, `taskId`, `status`, `dueDate`, `createdAt`):

```
Company (Tenant Root)
├── CompanyMember (User <-> Company bridge with assigned Role)
├── Role & RolePermission & Permission
├── Department
│   └── Team
│       └── TeamMember
├── Project
│   ├── ProjectMember
│   ├── Milestone
│   ├── ProjectTag & Tag
│   ├── Task
│   │   ├── TaskAssignee
│   │   ├── TaskChecklist
│   │   ├── TaskDependency
│   │   ├── TaskComment
│   │   ├── TaskAttachment
│   │   └── TaskActivity
│   ├── Bug
│   │   ├── BugComment
│   │   ├── BugAttachment
│   │   └── BugActivity
│   ├── Document & DocumentVersion
│   └── TimeEntry
├── Request & RequestComment & Approval
├── Meeting & MeetingParticipant
├── Notification
├── Invitation
└── AuditLog (Immutable security log)
```

---

## 10. API Route Architecture

| Route | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Password verification & JWT session issuance |
| `/api/auth/register` | `POST` | User & company onboarding |
| `/api/auth/logout` | `POST` | Clears authentication cookies |
| `/api/auth/me` | `GET` | Current user profile, active tenant, and permissions |
| `/api/projects` | `GET`, `POST` | List and create tenant projects |
| `/api/projects/[id]` | `GET`, `PATCH`, `DELETE` | Project detail, status update, deletion |
| `/api/tasks` | `GET`, `POST` | Filtered task list and creation |
| `/api/tasks/[id]` | `GET`, `PATCH`, `DELETE` | Task detail, edit, delete |
| `/api/tasks/[id]/status` | `PATCH` | **Kanban drag-and-drop persistent status update** |
| `/api/tasks/[id]/comments` | `POST` | Add task comment with `@mention` notifications |
| `/api/tasks/[id]/checklists` | `POST`, `PATCH` | Create and toggle checklist items |
| `/api/bugs` | `GET`, `POST` | List and report new issues |
| `/api/bugs/[id]` | `GET`, `PATCH` | Bug details, severity, status, QA reopen |
| `/api/requests` | `GET`, `POST` | Submit and retrieve internal requests |
| `/api/requests/[id]/approve`| `POST` | **Multi-step approval / rejection processing** |
| `/api/employees` | `GET`, `POST` | Employee directory and new member invitation |
| `/api/departments` | `GET`, `POST` | Department management |
| `/api/teams` | `GET`, `POST` | Team creation and member assignment |
| `/api/time` | `GET`, `POST` | Fetch time logs and record timer sessions |
| `/api/documents` | `GET`, `POST` | Upload and retrieve documents |
| `/api/meetings` | `GET`, `POST` | Schedule team meetings and video calls |
| `/api/calendar` | `GET` | Unified event feed (tasks, projects, meetings) |
| `/api/notifications` | `GET`, `PATCH` | Read, filter, and mark notifications as read |
| `/api/search` | `GET` | Global tenant-isolated search across all entities |
| `/api/reports` | `GET` | Analytics data for charts and CSV generation |
| `/api/audit-logs` | `GET` | Protected audit trail for company administrators |
| `/api/settings/company` | `GET`, `PATCH` | Company metadata and operating hours |
| `/api/settings/roles` | `GET` | Role matrix and permission assignments |

---

## 11. Environment Variables (`.env.example`)

```env
# Database connection string (PostgreSQL for production or SQLite for dev)
DATABASE_URL="postgresql://postgres:password@localhost:5432/project_management?schema=public"

# Authentication secret (used for signing JWT cookies)
AUTH_SECRET="your-super-secret-key-at-least-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary Object Storage (Optional for external cloud asset storage)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Resend Email Service (Optional for email notification dispatch)
RESEND_API_KEY="re_your_resend_api_key"
```

---

## 12. Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub.
2. Link the repository in the [Vercel Dashboard](https://vercel.com).
3. Connect a PostgreSQL database (e.g., Neon, Supabase, AWS RDS, or Vercel Postgres).
4. Add the environment variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`).
5. Ensure your build command is configured:
   ```bash
   npx prisma generate && next build
   ```

### Running with Docker / VPS
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

---

## 13. Production Verification & Compliance Checklist

- [x] Multi-Company Architecture with strict tenant isolation on every API route
- [x] Multi-Admin support per company
- [x] Server-side RBAC authorization on all endpoints
- [x] Drag-and-drop Kanban board with immediate PostgreSQL/database persistence
- [x] Nested subtasks with real-time percentage completion calculation
- [x] Task comments with `@mention` parsing and database notifications
- [x] Bug tracking with QA verification and reopen workflow
- [x] Internal request management with multi-stage approval audit trail
- [x] Stopwatch time tracking with manual entry options
- [x] Recharts dashboard analytics and CSV report downloads
- [x] Protected audit logging capturing Actor, Action, Entity, Description, and IP
- [x] Dark mode persistence with system preference fallback
- [x] No hardcoded demo credentials in production code
