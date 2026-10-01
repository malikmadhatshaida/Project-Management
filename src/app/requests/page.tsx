"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/components/providers/AppProvider";
import {
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  Filter,
} from "lucide-react";
import { getStatusBadgeClass, getPriorityBadgeClass, formatDate, formatDateTime } from "@/lib/utils";

const REQUEST_TYPES = [
  "LEAVE",
  "IT_SUPPORT",
  "EQUIPMENT",
  "HR_REQUEST",
  "WORK_FROM_HOME",
  "ACCESS_REQUEST",
  "GENERAL",
];

export default function RequestsPage() {
  const { session } = useApp();
  const [requests, setRequests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Submit request modal
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState("LEAVE");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedDepartmentId, setAssignedDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Approval action modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [approvalComments, setApprovalComments] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  const canApprove =
    session?.user.isSuperAdmin ||
    session?.membership.roleName === "COMPANY_ADMIN" ||
    session?.membership.roleName === "TEAM_LEAD" ||
    session?.permissions.includes("REQUEST_APPROVE");

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  }, [typeFilter, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
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
        if (d.length > 0 && !assignedDepartmentId) {
          setAssignedDepartmentId(d[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject,
          description,
          priority,
          assignedDepartmentId: assignedDepartmentId || undefined,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setSubject("");
        setDescription("");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessApproval = async () => {
    if (!selectedReq) return;
    setProcessingApproval(true);

    try {
      const res = await fetch(`/api/requests/${selectedReq.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: approvalAction,
          comments: approvalComments,
        }),
      });

      if (res.ok) {
        setApprovalModalOpen(false);
        setApprovalComments("");
        setSelectedReq(null);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingApproval(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Internal Requests & Approvals
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Submit and review leave requests, equipment procurement, and IT tickets
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Request
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No requests found.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {requests.map((r) => (
                <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {r.type.replace(/_/g, " ")}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(r.status)}`}>
                        {r.status.replace("_", " ")}
                      </span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(r.priority)}`}>
                        {r.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">Submitted {formatDate(r.createdAt)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.subject}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {r.description}
                    </p>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      Requester: <span className="font-semibold text-slate-800 dark:text-slate-200">{r.requester?.name}</span> ({r.requester?.jobTitle || "Employee"})
                    </div>

                    {/* Approval timeline trail */}
                    {r.approvals?.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/40 text-[11px]">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Approval Audit Trail:</div>
                        {r.approvals.map((ap: any) => (
                          <div key={ap.id} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            {ap.status === "APPROVED" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span>{ap.step.replace("_", " ")}: </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{ap.status}</span> by {ap.approver?.name}
                            {ap.comments && <span className="italic text-slate-500">(&quot;{ap.comments}&quot;)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions for Managers/Admins */}
                  {canApprove && (r.status === "PENDING" || r.status === "UNDER_REVIEW") && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedReq(r);
                          setApprovalAction("APPROVE");
                          setApprovalModalOpen(true);
                        }}
                        className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReq(r);
                          setApprovalAction("REJECT");
                          setApprovalModalOpen(true);
                        }}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Request Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Submit Internal Request</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Request Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    >
                      {REQUEST_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Annual Vacation Leave (5 Days)"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Detailed Justification & Dates *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full details, required equipment specs, or coverage arrangements..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
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
                    {submitting ? "Submitting..." : "Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {approvalModalOpen && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {approvalAction === "APPROVE" ? "Confirm Request Approval" : "Confirm Request Rejection"}
                </h3>
                <button onClick={() => setApprovalModalOpen(false)} className="text-slate-400">✕</button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You are about to <span className="font-bold">{approvalAction.toLowerCase()}</span> the request:
                  <br />
                  <span className="font-semibold text-slate-900 dark:text-white">&quot;{selectedReq.subject}&quot;</span> from {selectedReq.requester?.name}.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reviewer Comments (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add approval justification or feedback..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    onClick={() => setApprovalModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessApproval}
                    disabled={processingApproval}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs ${
                      approvalAction === "APPROVE"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {processingApproval ? "Processing..." : `Confirm ${approvalAction}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
