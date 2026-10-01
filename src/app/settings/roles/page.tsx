"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import { ShieldAlert, ShieldCheck, KeyRound, Users } from "lucide-react";

export default function RolesSettingsPage() {
  const { session } = useApp();
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
        setAllPermissions(data.allPermissions || []);
        if (data.roles?.length > 0) {
          setSelectedRole(data.roles[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      </AppShell>
    );
  }

  const rolePermissionCodes = new Set(
    selectedRole?.permissions?.map((p: any) => p.permission.code) || []
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Granular system permissions enforced both on client UI and Next.js server actions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Roles List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              System & Company Roles
            </h3>
            <div className="space-y-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition ${
                    selectedRole?.id === r.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div>{r.displayName}</div>
                    <div className={`text-[10px] ${selectedRole?.id === r.id ? "text-indigo-100" : "text-slate-400"}`}>
                      {r.name}
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    selectedRole?.id === r.id ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {r._count?.members || 0} members
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Matrix for Selected Role */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedRole?.displayName}
                </h3>
                <p className="text-xs text-slate-500">{selectedRole?.description || "Defined enterprise role."}</p>
              </div>
              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                {selectedRole?.permissions?.length || 0} Permissions Granted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {allPermissions.map((perm) => {
                const granted =
                  selectedRole?.name === "SUPER_ADMIN" ||
                  selectedRole?.name === "COMPANY_ADMIN" ||
                  rolePermissionCodes.has(perm.code);

                return (
                  <div
                    key={perm.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition ${
                      granted
                        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-950 dark:bg-emerald-950/20"
                        : "border-slate-100 bg-slate-50/50 opacity-40 dark:border-slate-800/40 dark:bg-slate-900"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      granted ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600 dark:bg-slate-700"
                    }`}>
                      {granted ? "✓" : "–"}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{perm.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{perm.code}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{perm.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
