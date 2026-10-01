import prisma from "@/lib/db/prisma";

export interface LogAuditParams {
  companyId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditAction(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error("Failed to log audit action:", err);
    // Don't crash the main operation if audit logging fails
  }
}
