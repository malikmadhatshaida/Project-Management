"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Bell, 
  Users, 
  Key, 
  ChevronRight, 
  SlidersHorizontal 
} from "lucide-react";
import { useAuth } from "@/components/providers/AppProvider";

export default function SettingsHubPage() {
  const { user, membership, permissions } = useAuth();
  const isAdmin = membership?.roleName === "COMPANY_ADMIN" || user?.isSuperAdmin;

  const settingsCards = [
    {
      title: "Company Profile & Working Hours",
      description: "Manage organization brand name, logo, domain, business working days, and operating hours.",
      href: "/settings/company",
      icon: Building2,
      badge: "Admin Only",
      adminOnly: true,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    },
    {
      title: "Roles & Granular Permissions",
      description: "View and configure RBAC roles, permission sets, and custom access levels across departments.",
      href: "/settings/roles",
      icon: ShieldCheck,
      badge: "Admin Only",
      adminOnly: true,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
    {
      title: "Compliance & Audit Trail",
      description: "Immutable security log of user actions, project modifications, permission shifts, and approvals.",
      href: "/settings/audit-logs",
      icon: ShieldAlert,
      badge: "Admin Only",
      adminOnly: true,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      title: "Team Members & Directory",
      description: "Invite new team members, manage active memberships, department assignments, and job titles.",
      href: "/employees",
      icon: Users,
      badge: "Manage",
      adminOnly: false,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      title: "Notification Preferences",
      description: "Review system notification alerts, task assignments, and review request alerts.",
      href: "/notifications",
      icon: Bell,
      badge: "All Users",
      adminOnly: false,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Settings & Configuration
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your enterprise tenant settings, security policies, and team preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            const disabled = card.adminOnly && !isAdmin;

            return (
              <Link
                key={card.href}
                href={disabled ? "#" : card.href}
                className={`p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${
                  disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm group"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {card.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                    {card.title}
                    {!disabled && <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
