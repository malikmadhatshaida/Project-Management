import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  code: z.string().min(2, "Project code must be at least 2 characters").max(10, "Max 10 characters").toUpperCase(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  managerId: z.string().optional(),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
});

export const taskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  parentTaskId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).default(0),
  actualHours: z.coerce.number().min(0).default(0),
  assigneeIds: z.array(z.string()).optional(),
});

export const bugSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(3, "Bug summary is required"),
  description: z.string().min(5, "Bug description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "FIXED", "READY_FOR_TESTING", "VERIFIED", "REOPENED", "CLOSED"]).default("OPEN"),
  environment: z.string().optional(),
  browserDevice: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  expectedResult: z.string().optional(),
  actualResult: z.string().optional(),
  assignedDevId: z.string().optional().nullable(),
  qaTesterId: z.string().optional().nullable(),
});

export const requestSchema = z.object({
  type: z.enum(["LEAVE", "IT_SUPPORT", "EQUIPMENT", "HR_REQUEST", "WORK_FROM_HOME", "ACCESS_REQUEST", "GENERAL"]),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedDepartmentId: z.string().optional().nullable(),
});

export const timeEntrySchema = z.object({
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  date: z.string().optional(),
  notes: z.string().optional(),
  isBillable: z.boolean().default(true),
});

export const meetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  meetingUrl: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

export const employeeInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});
