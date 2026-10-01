"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Briefcase,
  Users2,
  Users,
  Send,
  FileText,
  Video,
  BarChart3,
  Bell,
  Settings,
  ShieldAlert,
  Building2,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useApp();

  const isAdmin =
    session?.user.isSuperAdmin ||
    session?.membership.roleName === "COMPANY_ADMIN";

  const isClient = session?.membership.roleName === "CLIENT";

  // Navigation items based on RBAC and requirements
  const mainNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
    { name: "Projects", href: "/projects", icon: FolderKanban, visible: true },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, visible: true },
    { name: "Calendar", href: "/calendar", icon: Calendar, visible: true },
    { name: "My Work", href: "/my-work", icon: Briefcase, visible: !isClient },
    { name: "Teams", href: "/teams", icon: Users2, visible: !isClient },
    { name: "Employees", href: "/employees", icon: Users, visible: !isClient },
    { name: "Requests", href: "/requests", icon: Send, visible: !isClient },
    { name: "Documents", href: "/documents", icon: FileText, visible: true },
    { name: "Meetings", href: "/meetings", icon: Video, visible: !isClient },
    { name: "Reports", href: "/reports", icon: BarChart3, visible: !isClient },
    { name: "Notifications", href: "/notifications", icon: Bell, visible: true },
  ];

  // Administration items strictly restricted
  const adminNav = [
    { name: "Company Settings", href: "/settings/company", icon: Building2 },
    { name: "Roles & RBAC", href: "/settings/roles", icon: ShieldAlert },
    { name: "Audit Logs", href: "/settings/audit-logs", icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header: Company Logo / Name */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-xs">
              {session?.company.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.company.logo}
                  alt={session.company.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                session?.company.name?.charAt(0) || "P"
              )}
            </div>
            <div className="truncate">
              <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {session?.company.name || "Enterprise Workspace"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {session?.membership.roleDisplayName || "Workspace"}
              </div>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              Workspace
            </div>
            <nav className="mt-2 space-y-1">
              {mainNav
                .filter((item) => item.visible)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* Admin Management Section - only visible to company administrators */}
          {isAdmin && (
            <div>
              <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                Administration
              </div>
              <nav className="mt-2 space-y-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer tenant info */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <div className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Tenant: <span className="font-semibold text-slate-900 dark:text-white">{session?.company.slug}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
