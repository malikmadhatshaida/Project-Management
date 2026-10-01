"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Clock,
  Send,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  Plus,
  Play,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate } from "@/lib/utils";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export default function DashboardPage() {
  const { session } = useApp();
  const [data, setData] = useState<any>(null);
  const [myWorkTasks, setMyWorkTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"ADMIN" | "EMPLOYEE">("ADMIN");

  const isAdmin =
    session?.user.isSuperAdmin ||
    session?.membership.roleName === "COMPANY_ADMIN" ||
    session?.membership.roleName === "PROJECT_MANAGER";

  useEffect(() => {
    // Default view
    if (!isAdmin) {
      setViewMode("EMPLOYEE");
    }
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsRes, myTasksRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/tasks?myWork=true"),
      ]);

      if (reportsRes.ok) {
        const reportData = await reportsRes.json();
        setData(reportData);
      }
      if (myTasksRes.ok) {
        const tasks = await myTasksRes.json();
        setMyWorkTasks(tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  const { summary, tasksByStatus, tasksByPriority, bugsBySeverity, projectsList, departmentsList } = data;

  const statusChartData = Object.entries(tasksByStatus || {}).map(([key, val]) => ({
    name: key.replace("_", " "),
    count: Number(val) || 0,
  }));

  const priorityChartData = Object.entries(tasksByPriority || {}).map(([key, val]) => ({
    name: key,
    value: Number(val) || 0,
  }));

  // Employee specific metrics
  const now = new Date();
  const assignedCount = myWorkTasks.length;
  const overdueCount = myWorkTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
  ).length;
  const completedCount = myWorkTasks.filter((t) => t.status === "COMPLETED").length;
  const pendingCount = myWorkTasks.filter((t) => t.status !== "COMPLETED").length;

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Top Header & Role View Switcher */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {viewMode === "ADMIN" ? "Company Operations Dashboard" : "My Work & Personal Overview"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {viewMode === "ADMIN"
                ? `Real-time analytics for ${session?.company.name}`
                : `Active tasks, progress, and assignments for ${session?.user.name}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode("ADMIN")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "ADMIN"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Company Overview
                </button>
                <button
                  onClick={() => setViewMode("EMPLOYEE")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "EMPLOYEE"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  My Work View
                </button>
              </div>
            )}

            <Link
              href="/projects"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> New Project
            </Link>
          </div>
        </div>

        {/* 1. ADMIN DASHBOARD VIEW */}
        {viewMode === "ADMIN" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Projects</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalProjects}</span>
                  <span className="text-xs text-emerald-600 font-semibold">{summary.activeProjects} Active</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalTasks}</span>
                  <span className="text-xs text-emerald-600 font-semibold">{summary.completedTasks} Done</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Open Bugs</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <Bug className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{summary.openBugs}</span>
                  <span className="text-xs text-rose-600 font-semibold">{summary.overdueTasksCount} Overdue Tasks</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Requests</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                    <Send className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{summary.pendingRequests}</span>
                  <span className="text-xs text-slate-500">{summary.totalHoursLogged}h Tracked</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Tasks by Status Bar Chart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tasks by Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Current task distribution across all active company projects</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tasks by Priority Donut Chart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Task Priorities</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Urgency levels breakdown</p>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {priorityChartData.map((p, idx) => (
                    <div key={p.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span>{p.name} ({p.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Projects Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Projects Performance</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completion rate and tasks status</p>
                </div>
                <Link
                  href="/projects"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View All Projects <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Project</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                      <th className="py-3 px-4 font-semibold">Progress</th>
                      <th className="py-3 px-4 font-semibold">Tasks</th>
                      <th className="py-3 px-4 font-semibold">Bugs</th>
                      <th className="py-3 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {projectsList.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          <Link href={`/projects/${p.id}`} className="hover:underline">
                            {p.name} <span className="ml-1 text-[11px] text-slate-400">({p.code})</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(p.priority)}`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 w-44">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                style={{ width: `${p.progress}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{p.tasksCount}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{p.bugsCount}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/projects/${p.id}`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. EMPLOYEE "MY WORK" VIEW */}
        {viewMode === "EMPLOYEE" && (
          <div className="space-y-8">
            {/* My Work KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Tasks</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{assignedCount}</span>
                  <span className="text-xs text-indigo-600 font-semibold">{pendingCount} Active</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Tasks</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-600">{overdueCount}</span>
                  <span className="text-xs text-slate-400">Need immediate attention</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Work</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
                  <span className="text-xs text-emerald-600 font-semibold">Done</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Time Tracking</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">Active</span>
                  <Link href="/time" className="text-xs text-indigo-600 font-semibold hover:underline">
                    View Timesheets →
                  </Link>
                </div>
              </div>
            </div>

            {/* My Tasks Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">My Active Assignments</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tasks assigned directly to you</p>
                </div>
                <Link
                  href="/tasks"
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Go to Kanban Board <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {myWorkTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  🎉 No pending tasks assigned to you right now!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Task</th>
                        <th className="py-3 px-4 font-semibold">Project</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Priority</th>
                        <th className="py-3 px-4 font-semibold">Due Date</th>
                        <th className="py-3 px-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {myWorkTasks.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                            <Link href={`/tasks/${t.id}`} className="hover:underline">
                              {t.title}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{t.project?.name}</td>
                          <td className="py-3.5 px-4">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(t.status)}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(t.priority)}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {formatDate(t.dueDate)}
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
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
