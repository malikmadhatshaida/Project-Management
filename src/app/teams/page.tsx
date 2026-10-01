"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  Users2,
  Building2,
  Plus,
  Users,
  FolderKanban,
  CheckSquare,
  User,
} from "lucide-react";

export default function TeamsPage() {
  const { session } = useApp();
  const [teams, setTeams] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create team modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canManage =
    session?.user.isSuperAdmin ||
    session?.membership.roleName === "COMPANY_ADMIN" ||
    session?.permissions.includes("TEAM_CREATE");

  useEffect(() => {
    fetchTeams();
    fetchDepartments();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const d = await res.json();
        setDepartments(d);
        if (d.length > 0 && !departmentId) {
          setDepartmentId(d[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          departmentId: departmentId || undefined,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setName("");
        setDescription("");
        fetchTeams();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Teams & Departments
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Functional hierarchy, squads, and departmental resource mapping
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Create Team
            </button>
          )}
        </div>

        {/* Departments Overview */}
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">
            Company Departments
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {d._count?.members || 0} members
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{d.description || "General business department."}</p>
                <div className="mt-3 text-[11px] text-slate-400">
                  Manager: <span className="text-slate-700 dark:text-slate-300 font-medium">{d.manager?.name || "Unassigned"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teams Grid */}
        <div className="pt-4">
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-3">
            Active Functional Teams
          </h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No teams created yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users2 className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.name}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.description || "Active functional unit."}
                      </p>
                    </div>
                    {t.department && (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                        {t.department.name}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Lead: <span className="font-semibold text-slate-800 dark:text-slate-200">{t.teamLead?.name || "Unassigned"}</span>
                  </div>

                  {/* Members list */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                      Team Members ({t.members?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {t.members?.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] dark:border-slate-800 dark:bg-slate-800"
                        >
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white">
                            {m.user?.name?.charAt(0)}
                          </div>
                          <span>{m.user?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t._count?.projects || 0} Projects</span>
                    <span>{t._count?.tasks || 0} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Team Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Create New Team</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Infrastructure Squad"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Team responsibilities and mission..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
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
                    {submitting ? "Creating..." : "Create Team"}
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
