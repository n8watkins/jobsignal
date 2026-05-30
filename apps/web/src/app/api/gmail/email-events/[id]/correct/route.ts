import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CLASSIFICATION_TO_APP_STATUS } from "@/lib/gmail/events";

const BodySchema = z.object({
  classification: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "classification required" }, { status: 400 });

  const event = await prisma.emailEvent.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.emailEvent.update({
    where: { id },
    data: { reviewStatus: "corrected", correctedClassification: parsed.data.classification },
  });

  if (event.applicationId) {
    const newStatus = CLASSIFICATION_TO_APP_STATUS[parsed.data.classification];
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
            title: "Classification corrected",
            description: `Corrected to: ${parsed.data.classification} — ${event.subject}`,
            occurredAt: new Date(),
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
