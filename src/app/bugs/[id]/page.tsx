"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  Bug,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  User,
  Send,
  History,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate, formatDateTime } from "@/lib/utils";

const BUG_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "FIXED",
  "READY_FOR_TESTING",
  "VERIFIED",
  "REOPENED",
  "CLOSED",
];

export default function BugDetailPage() {
  const params = useParams();
  const { session } = useApp();
  const bugId = params.id as string;

  const [bug, setBug] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (bugId) {
      fetchBug();
    }
  }, [bugId]);

  const fetchBug = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bugs/${bugId}`);
      if (res.ok) {
        const data = await res.json();
        setBug(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/bugs/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchBug();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !bug) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/bugs" className="hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Bugs
          </Link>
          <span>/</span>
          <Link href={`/projects/${bug.project?.id}`} className="hover:underline font-semibold text-slate-700 dark:text-slate-300">
            {bug.project?.name}
          </Link>
        </div>

        {/* Bug Header Card */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-start">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(bug.status)}`}>
                {bug.status}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getPriorityBadgeClass(bug.severity)}`}>
                {bug.severity} Severity
              </span>
              <span className="text-xs text-slate-400">Reported {formatDate(bug.createdAt)}</span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {bug.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {bug.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {bug.status !== "REOPENED" && (
              <button
                onClick={() => handleStatusChange("REOPENED")}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <RotateCcw className="h-3.5 w-3.5" /> QA Reopen
              </button>
            )}

            <select
              value={bug.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              {BUG_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Reproduction & Evidence Details */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Triage & Reproduction Details</h3>

              {bug.stepsToReproduce && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Steps to Reproduce</h4>
                  <pre className="rounded-xl bg-slate-50 p-3 text-xs text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 whitespace-pre-wrap font-sans">
                    {bug.stepsToReproduce}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bug.expectedResult && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Expected Result</span>
                    <p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200">{bug.expectedResult}</p>
                  </div>
                )}
                {bug.actualResult && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/30 dark:bg-rose-950/20">
                    <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Actual Result</span>
                    <p className="mt-1 text-xs text-rose-900 dark:text-rose-200">{bug.actualResult}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bug Activity History */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-xs">
                <History className="h-4 w-4 text-slate-400" />
                <span>Complete Bug Lifecycle & QA History</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {bug.activities?.map((act: any) => (
                  <div key={act.id} className="text-[11px] text-slate-600 dark:text-slate-400 border-l-2 border-indigo-400 pl-2">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{act.details}</div>
                    <div className="text-[10px] text-slate-400">By {act.user?.name} on {formatDateTime(act.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Environment & Assignees */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
              <h4 className="font-semibold text-slate-900 dark:text-white">Environment & Assignments</h4>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Developer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bug.assignedDev?.name || "Unassigned"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">QA Verification Lead</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bug.qaTester?.name || "Unassigned"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Environment</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{bug.environment || "Not specified"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Browser & Device</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{bug.browserDevice || "Not specified"}</span>
              </div>

              {bug.resolvedAt && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-emerald-600 font-semibold block">Resolved On</span>
                  <span className="text-slate-600 dark:text-slate-400">{formatDate(bug.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
