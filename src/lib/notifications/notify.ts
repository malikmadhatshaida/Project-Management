import prisma from "@/lib/db/prisma";

export interface CreateNotificationParams {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        isRead: false,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
