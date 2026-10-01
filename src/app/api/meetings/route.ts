import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { meetingSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit/logger";
import { createNotification } from "@/lib/notifications/notify";

export async function GET(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where: any = {
      companyId: auth.membership.companyId,
    };
    if (projectId) where.projectId = projectId;

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, avatar: true, email: true } },
        project: { select: { id: true, name: true, code: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true, email: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = meetingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const meeting = await prisma.meeting.create({
      data: {
        companyId: auth.membership.companyId,
        title: data.title,
        description: data.description || null,
        projectId: data.projectId || null,
        organizerId: auth.user.id,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        meetingUrl: data.meetingUrl || null,
        location: data.location || null,
        notes: data.notes || null,
        participants: data.participantIds?.length
          ? {
              create: data.participantIds.map((uId) => ({
                userId: uId,
                status: uId === auth.user.id ? "ACCEPTED" : "INVITED",
              })),
            }
          : undefined,
      },
      include: {
        organizer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await logAuditAction({
      companyId: auth.membership.companyId,
      actorId: auth.user.id,
      action: "MEETING_SCHEDULED",
      entityType: "Meeting",
      entityId: meeting.id,
      description: `Scheduled meeting "${meeting.title}" on ${data.date} at ${data.startTime}`,
    });

    if (data.participantIds?.length) {
      for (const pId of data.participantIds) {
        if (pId !== auth.user.id) {
          await createNotification({
            companyId: auth.membership.companyId,
            userId: pId,
            title: "Meeting Scheduled",
            message: `You were invited to "${meeting.title}" scheduled for ${data.date} at ${data.startTime}.`,
            type: "MEETING_SCHEDULED",
            entityType: "meeting",
            entityId: meeting.id,
          });
        }
      }
    }

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
