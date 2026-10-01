"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  FolderKanban,
  Kanban,
  List,
  Calendar as CalendarIcon,
  Clock,
  Bug,
  FileText,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
  MoreVertical,
  Flag,
  User,
  ArrowLeft,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate } from "@/lib/utils";

const KANBAN_COLUMNS = [
  { key: "BACKLOG", label: "Backlog", color: "border-slate-300 dark:border-slate-700" },
  { key: "TODO", label: "To Do", color: "border-amber-400" },
  { key: "IN_PROGRESS", label: "In Progress", color: "border-blue-500" },
  { key: "IN_REVIEW", label: "In Review", color: "border-purple-500" },
  { key: "BLOCKED", label: "Blocked", color: "border-rose-500" },
  { key: "COMPLETED", label: "Completed", color: "border-emerald-500" },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useApp();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"KANBAN" | "LIST" | "TIMELINE" | "BUGS" | "DOCS">("KANBAN");

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstimatedHours, setTaskEstimatedHours] = useState(8);
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId") || draggedTaskId;
    if (!taskId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setDraggedTaskId(null);

    // Database mutation call
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchProject();
      }
    } catch {
      fetchProject();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTask(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: taskTitle,
          description: taskDesc,
          status: taskStatus,
          priority: taskPriority,
          dueDate: taskDueDate || undefined,
          estimatedHours: Number(taskEstimatedHours) || 0,
        }),
      });

      if (res.ok) {
        setTaskModalOpen(false);
        setTaskTitle("");
        setTaskDesc("");
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading || !project) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/projects"
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {project.code}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {project.description || "Active project workspace and deliverables."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTaskStatus("TODO");
                setTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("KANBAN")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "KANBAN"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban Board
            </button>
            <button
              onClick={() => setActiveTab("LIST")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "LIST"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List View
            </button>
            <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "TIMELINE"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Timeline / Gantt
            </button>
            <button
              onClick={() => setActiveTab("BUGS")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "BUGS"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Bug className="h-3.5 w-3.5" /> Bugs ({project.bugs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("DOCS")}
              className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "DOCS"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Documents ({project.documents?.length || 0})
            </button>
          </div>
        </div>

        {/* 1. KANBAN BOARD VIEW (With HTML5 Drag and Drop & Immediate PostgreSQL Persistence) */}
        {activeTab === "KANBAN" && (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {KANBAN_COLUMNS.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.key);

              return (
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  {/* Column Header */}
                  <div className={`flex items-center justify-between border-t-2 ${col.color} pt-2 pb-3`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {col.label}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {columnTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setTaskStatus(col.key);
                        setTaskModalOpen(true);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Task Cards */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[280px]">
                    {columnTasks.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        className={`cursor-grab active:cursor-grabbing rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-indigo-400 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/80 ${
                          draggedTaskId === t.id ? "opacity-50 border-dashed border-indigo-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/tasks/${t.id}`}
                            className="text-xs font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 leading-snug"
                          >
                            {t.title}
                          </Link>
                        </div>

                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {t.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className={`rounded-md px-1.5 py-0.5 font-semibold ${getPriorityBadgeClass(t.priority)}`}>
                            {t.priority}
                          </span>

                          <div className="flex items-center gap-2 text-slate-400">
                            {t.dueDate && (
                              <span className="flex items-center gap-0.5">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(t.dueDate)}
                              </span>
                            )}
                            {t.assignees?.length > 0 && (
                              <div className="flex -space-x-1">
                                {t.assignees.slice(0, 2).map((a: any) => (
                                  <div
                                    key={a.id}
                                    title={a.user?.name}
                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-1 ring-white dark:ring-slate-900"
                                  >
                                    {a.user?.name?.charAt(0) || "U"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. LIST VIEW */}
        {activeTab === "LIST" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Task</th>
                    <th className="py-3 px-4 font-semibold">Assignee</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Due Date</th>
                    <th className="py-3 px-4 font-semibold">Est / Actual</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <Link href={`/tasks/${t.id}`} className="hover:underline">
                          {t.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.assignees?.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                              {t.assignees[0].user?.name?.charAt(0)}
                            </div>
                            <span className="text-slate-600 dark:text-slate-300">{t.assignees[0].user?.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(t.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {t.estimatedHours || 0}h / {t.actualHours || 0}h
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/tasks/${t.id}`}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. TIMELINE / GANTT VIEW */}
        {activeTab === "TIMELINE" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Project Gantt & Milestone Timeline</h3>
              <p className="text-xs text-slate-500">Track task durations, target delivery schedules, and dependencies.</p>
            </div>

            <div className="space-y-4 pt-2">
              {tasks.map((t, idx) => {
                const widthPercent = Math.min(100, Math.max(25, (t.estimatedHours || 8) * 3));
                return (
                  <div key={t.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</span>
                      <span className="text-slate-400 text-[11px]">Due: {formatDate(t.dueDate)} ({t.estimatedHours || 0}h)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          t.status === "COMPLETED" ? "bg-emerald-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. BUGS TAB */}
        {activeTab === "BUGS" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Reported Issues & QA Tracking</h3>
              <Link
                href="/bugs"
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Report Bug
              </Link>
            </div>

            {project.bugs?.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">Zero open bugs on this project!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-500 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Bug Title</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Assigned Dev</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {project.bugs.map((b: any) => (
                      <tr key={b.id}>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{b.title}</td>
                        <td className="py-3 px-3">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(b.severity)}`}>
                            {b.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {b.assignedDev?.name || "Unassigned"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/bugs/${b.id}`} className="text-indigo-600 hover:underline">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. DOCUMENTS TAB */}
        {activeTab === "DOCS" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Project Documentation</h3>
            {project.documents?.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No documents linked yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.documents.map((d: any) => (
                  <div key={d.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{d.title}</div>
                        <div className="text-[10px] text-slate-400">{d.fileType} • {formatDate(d.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Task Modal */}
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Task</h3>
                <button
                  onClick={() => setTaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Implement OAuth Flow"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Task details and acceptance criteria..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    >
                      {KANBAN_COLUMNS.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={taskEstimatedHours}
                      onChange={(e) => setTaskEstimatedHours(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTask}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submittingTask ? "Saving..." : "Add Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
