"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  User,
  Mail,
  Phone,
  Building2,
  Users2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [empRes, tasksRes] = await Promise.all([
        fetch("/api/employees"),
        fetch(`/api/tasks?assigneeId=${userId}`),
      ]);

      if (empRes.ok) {
        const allEmps = await empRes.json();
        const found = allEmps.find((e: any) => e.userId === userId || e.id === userId);
        setProfile(found);
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        setTasks(t);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  const skillsList = profile.skills ? profile.skills.split(",").map((s: string) => s.trim()) : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/employees" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="h-3 w-3" /> Back to Employee Directory
        </Link>

        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt={profile.name} className="h-full w-full rounded-3xl object-cover" />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{profile.name}</h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{profile.jobTitle || "Team Member"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {profile.role?.displayName || "Member"}
                  </span>
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.phone || "+1 (555) 019-2000"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Department: {profile.department?.name || "General"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Team: {profile.team?.name || "None"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Joined: {formatDate(profile.joiningDate)}</span>
              </div>
            </div>
          </div>

          {/* Bio & Skills */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {profile.bio && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">About</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {skillsList.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Technical Skills & Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Assigned Deliverables ({tasks.length})
          </h3>

          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active tasks assigned to this employee.</p>
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
                        <Link
                          href={`/tasks/${t.id}`}
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
          )}
        </div>
      </div>
    </AppShell>
  );
}
