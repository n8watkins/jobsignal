import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PATCHABLE = ["status", "nextAction", "actionNeeded", "interestLevel", "notes", "interviewDate", "contactName", "contactEmail", "lastContactAt"];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  applied: "Applied",
  application_confirmed: "Confirmed",
  recruiter_responded: "Recruiter Replied",
  interview_requested: "Interview Requested",
  assessment_requested: "Assessment Requested",
  interviewing: "Interviewing",
  offer_final_stage: "Offer / Final Stage",
  rejected: "Rejected",
  archived: "Archived",
  not_pursuing: "Not Pursuing",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      jobPosting: {
        include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
      events: { orderBy: { occurredAt: "desc" } },
    },
  });
  if (!app) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ application: app });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => PATCHABLE.includes(k)));

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  try {
    const current = await prisma.application.findUnique({ where: { id }, select: { userId: true, status: true } });
    if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const newStatus = typeof data.status === "string" ? data.status : null;
    const statusChanged = newStatus && newStatus !== current.status;

    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({ where: { id }, data });

      if (statusChanged) {
        await tx.applicationEvent.create({
          data: {
            userId: current.userId,
            applicationId: id,
            type: "status_changed",
            title: STATUS_LABELS[newStatus] ?? newStatus,
            description: `Status changed from ${STATUS_LABELS[current.status] ?? current.status} to ${STATUS_LABELS[newStatus] ?? newStatus}`,
            occurredAt: new Date(),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ application });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw err;
  }
}
