import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDurationHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "COMPLETED":
    case "APPROVED":
    case "VERIFIED":
    case "FIXED":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    case "IN_PROGRESS":
    case "UNDER_REVIEW":
    case "ASSIGNED":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20";
    case "TODO":
    case "PENDING":
    case "PLANNING":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    case "BLOCKED":
    case "REJECTED":
    case "CRITICAL":
    case "REOPENED":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    case "BACKLOG":
    case "ON_HOLD":
    case "ARCHIVED":
    default:
      return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20";
  }
}

export function getPriorityBadgeClass(priority: string): string {
  switch (priority.toUpperCase()) {
    case "CRITICAL":
    case "URGENT":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    case "HIGH":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20";
    case "MEDIUM":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    case "LOW":
    default:
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20";
  }
}
