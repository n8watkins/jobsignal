import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();

  const { title, type = "note", description, occurredAt } = body;
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id }, select: { userId: true } });
  if (!application) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const event = await prisma.applicationEvent.create({
    data: {
      userId: application.userId,
      applicationId: id,
      type,
      title,
      description: description ?? null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    },
  });

  return NextResponse.json({ event });
}
