"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  BarChart3,
  Download,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Bug,
  Clock,
  TrendingUp,
  FileSpreadsheet,
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
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export default function ReportsPage() {
  const { session } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open("/api/reports?export=csv", "_blank");
  };

  if (loading || !data) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  const { summary, tasksByStatus, tasksByPriority, bugsBySeverity, projectsList, departmentsList } = data;

  const statusData = Object.entries(tasksByStatus || {}).map(([key, count]) => ({
    status: key.replace("_", " "),
    tasks: Number(count) || 0,
  }));

  const bugData = Object.entries(bugsBySeverity || {}).map(([key, count]) => ({
    name: key,
    value: Number(count) || 0,
  }));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Analytics & Performance Reports
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cross-organizational deliverables, bug discovery rates, and team productivity logs
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Tasks CSV
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500">Active Delivery Sprints</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{summary.activeProjects} / {summary.totalProjects}</div>
            <div className="mt-1 text-[11px] text-slate-400">Projects on track</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500">Task Completion Rate</span>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
            </div>
            <div className="mt-1 text-[11px] text-slate-400">{summary.completedTasks} completed of {summary.totalTasks} total</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500">Open Quality Defect Triage</span>
            <div className="mt-2 text-2xl font-bold text-rose-600">{summary.openBugs}</div>
            <div className="mt-1 text-[11px] text-slate-400">Of {summary.totalBugs} total reported</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500">Productive Hours Logged</span>
            <div className="mt-2 text-2xl font-bold text-indigo-600">{summary.totalHoursLogged} hrs</div>
            <div className="mt-1 text-[11px] text-slate-400">Across {summary.totalEmployees} employees</div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Status Breakdown Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Task Status Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Real-time status volume from database</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
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
                  <Bar dataKey="tasks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bugs Severity Donut Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Bug Severity Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Critical vs low-impact issues</p>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bugData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {bugData.map((entry, index) => (
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
              {bugData.map((b, idx) => (
                <div key={b.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span>{b.name} ({b.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Velocity & Department Table */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Projects Velocity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Project Velocity & Progress</h3>
            <div className="space-y-4">
              {projectsList.map((p: any) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-slate-500">{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Headcount */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Department Resource Allocations</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {departmentsList.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-3 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.name}</span>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{d.memberCount} Members</span>
                    <span>{d.projectCount} Projects</span>
                    <span>{d.taskCount} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
