"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  FolderKanban,
  CheckSquare,
  User,
  TrendingUp,
} from "lucide-react";
import { formatDate, formatDurationHours } from "@/lib/utils";

export default function TimeTrackingPage() {
  const { session, timer, startTimer, stopTimer } = useApp();
  const [entries, setEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  // Manual entry modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [hours, setHours] = useState(2);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isBillable, setIsBillable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTimeEntries();
    fetchProjects();
  }, []);

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/time");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotalMinutes(data.totalMinutes || 0);
        setTotalHours(data.totalHours || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const p = await res.json();
        setProjects(p);
        if (p.length > 0 && !selectedProjectId) {
          setSelectedProjectId(p[0].id);
          fetchTasksForProject(p[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasksForProject = async (pId: string) => {
    try {
      const res = await fetch(`/api/tasks?projectId=${pId}`);
      if (res.ok) {
        const t = await res.json();
        setTasks(t);
        if (t.length > 0) setSelectedTaskId(t[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectSelect = (pId: string) => {
    setSelectedProjectId(pId);
    fetchTasksForProject(pId);
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const durationMinutes = Math.round(Number(hours) * 60);
      const res = await fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId || undefined,
          taskId: selectedTaskId || undefined,
          durationMinutes,
          notes,
          date,
          isBillable,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setNotes("");
        setHours(2);
        fetchTimeEntries();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimerSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Time Tracking & Timesheets
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Live timers, manual logs, billable deliverables, and productivity metrics
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Log Manual Time
          </button>
        </div>

        {/* Live Stopwatch Card */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 p-6 shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-purple-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Workspace Timer</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {timer.isRunning ? "Tracking active work session..." : "Ready to track your current task"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="font-mono text-3xl font-extrabold tracking-wider text-indigo-700 dark:text-indigo-300">
                {formatTimerSeconds(timer.seconds)}
              </div>
              {timer.isRunning ? (
                <button
                  onClick={stopTimer}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition"
                >
                  <Square className="h-4 w-4 fill-current" /> Stop & Log
                </button>
              ) : (
                <button
                  onClick={() => startTimer(projects[0]?.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  <Play className="h-4 w-4 fill-current" /> Start Timer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hours Tracked</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalHours} hrs</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Entries Logged</span>
            <div className="mt-2 text-2xl font-bold text-indigo-600">{entries.length} logs</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Billable Ratio</span>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {entries.length > 0
                ? Math.round((entries.filter((e) => e.isBillable).length / entries.length) * 100)
                : 100}
              %
            </div>
          </div>
        </div>

        {/* Time Entries Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Logged Work Entries</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No time recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Project</th>
                    <th className="py-3 px-4 font-semibold">Task</th>
                    <th className="py-3 px-4 font-semibold">Notes</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 text-right font-semibold">Billable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {e.user?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{e.project?.name || "-"}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{e.task?.title || "-"}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{e.notes || "-"}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{formatDate(e.date)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {formatDurationHours(e.durationMinutes)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${e.isBillable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                          {e.isBillable ? "Billable" : "Internal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manual Time Entry Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Log Work Time</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleManualEntry} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                {tasks.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Associated Task (Optional)
                    </label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    >
                      <option value="">None (Project general)</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hours Spent *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      required
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you work on?..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Log Time"}
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
