import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, comments, step } = body; // action: "APPROVE" | "REJECT", step: "MANAGER_REVIEW" | "ADMIN_HR_REVIEW"

    // Verify permission to approve
    const canApprove =
      auth.user.isSuperAdmin ||
      auth.membership.roleName === "COMPANY_ADMIN" ||
      auth.membership.roleName === "TEAM_LEAD" ||
      auth.permissions.includes("REQUEST_APPROVE");

    if (!canApprove) {
      return NextResponse.json({ error: "Forbidden: Cannot approve requests" }, { status: 403 });
    }

    const requestItem = await prisma.request.findFirst({
      where: { id, companyId: auth.membership.companyId },
      include: { approvals: true, requester: true },
    });

    if (!requestItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isApprove = action === "APPROVE";
    const currentStep = step || (requestItem.approvals.length === 0 ? "MANAGER_REVIEW" : "ADMIN_HR_REVIEW");

    // Add approval record
    await prisma.approval.create({
      data: {
        requestId: id,
        approverId: auth.user.id,
        step: currentStep,
        status: isApprove ? "APPROVED" : "REJECTED",
        comments: comments || null,
        approvedAt: isApprove ? new Date() : null,
      },
    });

    let newStatus = requestItem.status;
    if (!isApprove) {
      newStatus = "REJECTED";
    } else {
      // If was PENDING and approved at MANAGER_REVIEW -> UNDER_REVIEW
      // If was UNDER_REVIEW and approved at ADMIN_HR_REVIEW -> APPROVED
      if (requestItem.status === "PENDING" && currentStep === "MANAGER_REVIEW") {
        newStatus = "UNDER_REVIEW";
      } else {
        newStatus = "APPROVED";
      }
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { status: newStatus },
    });

    const actionText = isApprove ? "approved" : "rejected";
    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: isApprove ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      entityType: "Request",
      entityId: id,
      description: `${auth.user.name} ${actionText} request "${requestItem.subject}" (Step: ${currentStep})`,
    });

    // Notify requester
    await createNotification({
      companyId: auth.membership.companyId,
      userId: requestItem.requesterId,
      title: `Request ${isApprove ? (newStatus === "APPROVED" ? "Approved" : "Reviewed") : "Rejected"}`,
      message: `Your request "${requestItem.subject}" was ${actionText} by ${auth.user.name}.`,
      type: "REQUEST_STATUS",
      entityType: "request",
      entityId: id,
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Failed to process approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
