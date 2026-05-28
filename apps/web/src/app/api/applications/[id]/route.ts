import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PATCHABLE = ["status", "nextAction", "actionNeeded", "interestLevel", "notes", "contactName", "contactEmail", "lastContactAt"];

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
    const application = await prisma.application.update({ where: { id }, data });
    return NextResponse.json({ application });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw err;
  }
}
