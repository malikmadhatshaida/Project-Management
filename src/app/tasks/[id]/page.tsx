"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import confetti from "canvas-confetti";
import {
  CheckSquare,
  Clock,
  Calendar,
  Send,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Paperclip,
  User,
  History,
  Check,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate, formatDateTime } from "@/lib/utils";

const STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "COMPLETED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, startTimer } = useApp();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // New checklist item state
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  // Subtask creation state
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskHours, setSubtaskHours] = useState(4);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "COMPLETED") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChecklistTitle }),
      });
      if (res.ok) {
        setNewChecklistTitle("");
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (itemId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isCompleted: !currentState }),
      });
      if (res.ok) {
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: task.projectId,
          parentTaskId: taskId,
          title: subtaskTitle,
          estimatedHours: subtaskHours,
          status: "TODO",
        }),
      });
      if (res.ok) {
        setSubtaskModalOpen(false);
        setSubtaskTitle("");
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !task) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  // Calculate Subtasks completion percentage
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s: any) => s.status === "COMPLETED").length || 0;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Calculate Checklists completion percentage
  const totalChecklist = task.checklists?.length || 0;
  const completedChecklist = task.checklists?.filter((c: any) => c.isCompleted).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/tasks" className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Tasks
          </Link>
          <span>/</span>
          <Link href={`/projects/${task.project?.id}`} className="hover:underline font-semibold text-slate-700 dark:text-slate-300">
            {task.project?.name}
          </Link>
        </div>

        {/* Task Header */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-start">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(task.status)}`}>
                {task.status}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeClass(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-xs text-slate-400">Created {formatDate(task.createdAt)}</span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {task.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => startTimer(task.projectId, task.id, `Working on: ${task.title}`)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Track Time
            </button>

            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  Move to {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Column: Subtasks, Checklist, and Comments */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Nested Subtasks */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Nested Subtasks</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {completedSubtasks} / {totalSubtasks} completed ({subtasksPercent}%)
                  </span>
                </div>
                <button
                  onClick={() => setSubtaskModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Subtask
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${subtasksPercent}%` }}
                ></div>
              </div>

              {totalSubtasks === 0 ? (
                <p className="text-xs text-slate-400 italic">No subtasks defined yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {task.subtasks.map((st: any) => (
                    <div key={st.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${st.status === "COMPLETED" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                        <Link href={`/tasks/${st.id}`} className="text-xs font-medium text-slate-800 hover:underline dark:text-slate-200">
                          {st.title}
                        </Link>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(st.status)}`}>
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Checklists */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Task Checklist</h3>
                  <span className="text-xs text-slate-500">
                    {completedChecklist}/{totalChecklist} done ({checklistPercent}%)
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {task.checklists?.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id, item.isCompleted)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition"
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                        item.isCompleted
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {item.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs ${
                        item.isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  Add
                </button>
              </form>
            </div>

            {/* 3. Real-time Task Comments with @Mentions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Comments & Discussion ({task.comments?.length || 0})
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {task.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No comments posted yet.</p>
                ) : (
                  task.comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3 rounded-xl bg-slate-50/70 p-3 dark:bg-slate-800/40">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
                        {c.author?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.author.avatar} alt={c.author.name} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          c.author?.name?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{c.author?.name}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} className="pt-2">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment... (Type @name to mention team members)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" /> Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Metadata, Assignees, and Activity */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 text-xs">
              <h4 className="font-semibold text-slate-900 dark:text-white">Task Details</h4>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Assignees</span>
                {task.assignees?.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.assignees.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                          {a.user?.name?.charAt(0)}
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{a.user?.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Unassigned</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Due Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(task.dueDate)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Estimated Hours</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{task.estimatedHours || 0} hrs</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Actual Tracked</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{task.actualHours || 0} hrs</span>
                </div>
              </div>
            </div>

            {/* Activity History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-xs">
                <History className="h-4 w-4 text-slate-400" />
                <span>Activity History</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {task.activities?.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No activity logged.</p>
                ) : (
                  task.activities.map((act: any) => (
                    <div key={act.id} className="text-[11px] text-slate-600 dark:text-slate-400 border-l-2 border-slate-200 pl-2 dark:border-slate-800">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{act.details}</div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(act.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtask Modal */}
        {subtaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Nested Subtask</h3>
                <button
                  onClick={() => setSubtaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubtask} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subtask Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="e.g. Unit test authorization middleware"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={subtaskHours}
                    onChange={(e) => setSubtaskHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSubtaskModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Add Subtask
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
