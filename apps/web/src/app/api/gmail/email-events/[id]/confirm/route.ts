import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CLASSIFICATION_TO_APP_STATUS } from "@/lib/gmail/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const event = await prisma.emailEvent.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.emailEvent.update({ where: { id }, data: { reviewStatus: "confirmed" } });

  if (event.applicationId) {
    const newStatus = CLASSIFICATION_TO_APP_STATUS[event.classification];
    if (newStatus) {
      await prisma.$transaction([
        prisma.application.update({
          where: { id: event.applicationId },
          data: { status: newStatus, actionNeeded: false, lastContactAt: event.receivedAt },
        }),
        prisma.applicationEvent.create({
          data: {
            userId: user.id,
            applicationId: event.applicationId,
            type: "status_change",
            title: statusTitle(event.classification),
            description: `Gmail signal confirmed: ${event.subject}`,
            occurredAt: event.receivedAt,
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}

function statusTitle(classification: string): string {
  const map: Record<string, string> = {
    rejection: "Rejection confirmed",
    interview_request: "Interview requested",
    assessment_request: "Assessment received",
    application_confirmation: "Application confirmed",
    offer: "Offer received",
    recruiter_outreach: "Recruiter responded",
  };
  return map[classification] ?? "Email signal confirmed";
}
