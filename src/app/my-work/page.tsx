"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Calendar,
  ArrowRight,
  Play,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate } from "@/lib/utils";

export default function MyWorkPage() {
  const { session, startTimer } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [tasksRes, requestsRes] = await Promise.all([
        fetch("/api/tasks?myWork=true"),
        fetch("/api/requests?myOnly=true"),
      ]);

      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t);
      }
      if (requestsRes.ok) {
        const r = await requestsRes.json();
        setRequests(r);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const dueTodayTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate.startsWith(todayStr) && t.status !== "COMPLETED"
  );
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
  );
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) > now && t.status !== "COMPLETED"
  );
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Work Center
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Personal workload, scheduled deadlines, and your internal requests
          </p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Today</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{dueTodayTasks.length}</span>
              <span className="text-xs text-slate-400">Tasks</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{overdueTasks.length}</span>
              <span className="text-xs text-rose-500 font-semibold">Immediate action</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Upcoming Sprint Tasks</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600">{upcomingTasks.length}</span>
              <span className="text-xs text-slate-400">In queue</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recently Completed</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{completedTasks.length}</span>
              <span className="text-xs text-emerald-600 font-semibold">Done</span>
            </div>
          </div>
        </div>

        {/* Overdue Alert banner if any */}
        {overdueTasks.length > 0 && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-xs mb-2">
              <AlertTriangle className="h-4 w-4" /> You have {overdueTasks.length} overdue task(s):
            </div>
            <div className="space-y-1.5 pl-6">
              {overdueTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <Link href={`/tasks/${t.id}`} className="font-medium text-rose-900 hover:underline dark:text-rose-200">
                    {t.title} ({t.project?.name})
                  </Link>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">Due: {formatDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Tasks Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">All My Assigned Tasks</h3>

          {tasks.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No tasks currently assigned to you.</div>
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
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
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
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{formatDate(t.dueDate)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startTimer(t.projectId, t.id, `Working on: ${t.title}`)}
                            title="Start tracking time"
                            className="rounded-lg border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-400"
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </button>
                          <Link
                            href={`/tasks/${t.id}`}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Requests Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">My Internal Requests</h3>
              <p className="text-xs text-slate-500">Track leave, equipment, and IT requests</p>
            </div>
            <Link
              href="/requests"
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Submit New Request →
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No requests submitted yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{r.subject}</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Type: {r.type} • Submitted {formatDate(r.createdAt)}</div>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
