import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  rawText: z.string().min(50, "Paste enough resume text for analysis").optional(),
  isDefault: z.literal(true).optional(),
});

const RESUME_SELECT = {
  id: true,
  name: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
  rawText: true,
} as const;

type ResumeRow = { id: string; name: string; isDefault: boolean; createdAt: Date; updatedAt: Date; rawText: string | null };

function shape(resume: ResumeRow) {
  return {
    id: resume.id,
    name: resume.name,
    isDefault: resume.isDefault,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    characterCount: resume.rawText?.length || 0,
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = PatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getCurrentUser();
  const existing = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const resume = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.resumeVersion.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.resumeVersion.update({
      where: { id },
      data: {
        name: parsed.data.name,
        rawText: parsed.data.rawText,
        isDefault: parsed.data.isDefault ?? undefined,
      },
      select: RESUME_SELECT,
    });
  });

  return NextResponse.json({ resumeVersion: shape(resume) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  const existing = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.resumeVersion.delete({ where: { id } });

  // Keep a default around: promote the most recent remaining resume.
  if (existing.isDefault) {
    const next = await prisma.resumeVersion.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    if (next) await prisma.resumeVersion.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return NextResponse.json({ ok: true });
}
