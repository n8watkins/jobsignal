import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

const ResumeVersionRequestSchema = z.object({
  name: z.string().min(1, "Resume name is required"),
  rawText: z.string().min(50, "Paste enough resume text for analysis"),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: DEFAULT_USER_NAME },
    create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
  });

  const resumeVersions = await prisma.resumeVersion.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
      updatedAt: true,
      rawText: true,
    },
  });

  return NextResponse.json({
    resumeVersions: resumeVersions.map((resume) => ({
      id: resume.id,
      name: resume.name,
      isDefault: resume.isDefault,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      characterCount: resume.rawText?.length || 0,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ResumeVersionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: DEFAULT_USER_NAME },
    create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
  });

  const shouldSetDefault = parsed.data.isDefault || (await prisma.resumeVersion.count({ where: { userId: user.id } })) === 0;

  const resumeVersion = await prisma.$transaction(async (tx) => {
    if (shouldSetDefault) {
      await tx.resumeVersion.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    return tx.resumeVersion.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        rawText: parsed.data.rawText,
        isDefault: shouldSetDefault,
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        rawText: true,
      },
    });
  });

  return NextResponse.json({
    resumeVersion: {
      id: resumeVersion.id,
      name: resumeVersion.name,
      isDefault: resumeVersion.isDefault,
      createdAt: resumeVersion.createdAt,
      updatedAt: resumeVersion.updatedAt,
      characterCount: resumeVersion.rawText?.length || 0,
    },
  });
}
