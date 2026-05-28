import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type MarkAppliedPayload = {
  source?: string;
  sourceJobId?: string;
  jobUrl?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  workplaceType?: string;
  employmentType?: string;
  salaryText?: string | null;
  salaryListed?: boolean;
  rawDescription?: string;
  applicationMethod?: string;
  applicationSourceType?: string;
  recruiterName?: string;
  recruiterCompany?: string;
  recruiterNotes?: string;
  resumeLabel?: string;
  notes?: string;
  appliedAt?: string;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as MarkAppliedPayload;
    const companyName = clean(input.companyName) || "Unknown Company";
    const roleTitle = clean(input.roleTitle) || "Unknown Role";
    const appliedAt = input.appliedAt ? new Date(input.appliedAt) : new Date();
    const salaryText = clean(input.salaryText || undefined) || null;
    const salaryListed = Boolean(input.salaryListed || salaryText);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: DEFAULT_USER_EMAIL },
        update: { name: DEFAULT_USER_NAME },
        create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
      });

      const existingJobPosting = await findExistingJobPosting(tx, {
        userId: user.id,
        source: input.source,
        sourceJobId: input.sourceJobId,
        jobUrl: input.jobUrl,
        companyName,
        roleTitle,
      });

      const jobPostingData = {
        companyName,
        roleTitle,
        canonicalCompanyName: normalize(companyName),
        canonicalRoleTitle: normalize(roleTitle),
        jobUrl: input.jobUrl,
        source: input.source || "linkedin",
        sourceJobId: input.sourceJobId,
        rawDescription: input.rawDescription,
        location: clean(input.location),
        workplaceType: input.workplaceType || "unknown",
        employmentType: input.employmentType || "unknown",
        salaryText,
        salaryListed,
        redFlags: JSON.stringify(salaryListed ? [] : ["No salary listed"]),
        extractedConfidence: 0.8,
      };

      const jobPosting = existingJobPosting
        ? await tx.jobPosting.update({
            where: { id: existingJobPosting.id },
            data: {
              ...jobPostingData,
              jobUrl: input.jobUrl || existingJobPosting.jobUrl,
              rawDescription: input.rawDescription || existingJobPosting.rawDescription,
              location: clean(input.location) || existingJobPosting.location,
              sourceJobId: input.sourceJobId || existingJobPosting.sourceJobId,
            },
          })
        : await tx.jobPosting.create({
            data: {
              userId: user.id,
              ...jobPostingData,
            },
          });

      const existingApplication = await tx.application.findUnique({
        where: { jobPostingId: jobPosting.id },
      });

      const sourceNote = buildSourceNote(input);
      const application = existingApplication
        ? await tx.application.update({
            where: { id: existingApplication.id },
            data: {
              status: existingApplication.status === "rejected" ? existingApplication.status : "applied",
              source: input.source || existingApplication.source || "linkedin",
              applicationMethod: input.applicationMethod || existingApplication.applicationMethod || "linkedin_easy_apply",
              appliedAt: existingApplication.appliedAt || appliedAt,
              notes: mergeNotes(existingApplication.notes, sourceNote),
            },
          })
        : await tx.application.create({
            data: {
              userId: user.id,
              jobPostingId: jobPosting.id,
              status: "applied",
              source: input.source || "linkedin",
              applicationMethod: input.applicationMethod || "linkedin_easy_apply",
              appliedAt,
              notes: sourceNote,
            },
          });

      await tx.applicationEvent.create({
        data: {
          userId: user.id,
          applicationId: application.id,
          type: existingApplication ? "manual_update" : "applied",
          title: existingApplication ? "Application re-confirmed from extension" : "Applied",
          description: `Marked applied from ${input.source || "linkedin"}${input.jobUrl ? `: ${input.jobUrl}` : ""}`,
          metadata: JSON.stringify({
            source: input.source,
            sourceJobId: input.sourceJobId,
            jobUrl: input.jobUrl,
            salaryListed,
            salaryText,
            applicationSourceType: input.applicationSourceType,
            recruiterName: input.recruiterName,
            recruiterCompany: input.recruiterCompany,
            recruiterNotes: input.recruiterNotes,
            resumeLabel: input.resumeLabel,
          }),
          occurredAt: appliedAt,
        },
      });

      return { jobPosting, application };
    });

    return withCors(
      NextResponse.json({
        ok: true,
        applicationId: result.application.id,
        jobPostingId: result.jobPosting.id,
        status: result.application.status,
        duplicateStatus: "checked",
        analysisQueued: false,
        applicationUrl: `/applications/${result.application.id}`,
      }),
    );
  } catch (error) {
    console.error("[mark-applied] failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return withCors(
      NextResponse.json({ ok: false, error: "mark_applied_failed", message, hint: getErrorHint(message) }, { status: 500 }),
    );
  }
}

async function findExistingJobPosting(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    source?: string;
    sourceJobId?: string;
    jobUrl?: string;
    companyName: string;
    roleTitle: string;
  },
) {
  if (input.sourceJobId) {
    const bySourceId = await tx.jobPosting.findFirst({
      where: { userId: input.userId, source: input.source, sourceJobId: input.sourceJobId },
    });
    if (bySourceId) return bySourceId;
  }

  if (input.jobUrl) {
    const byUrl = await tx.jobPosting.findFirst({ where: { userId: input.userId, jobUrl: input.jobUrl } });
    if (byUrl) return byUrl;
  }

  return tx.jobPosting.findFirst({
    where: {
      userId: input.userId,
      canonicalCompanyName: normalize(input.companyName),
      canonicalRoleTitle: normalize(input.roleTitle),
    },
  });
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function getErrorHint(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("database_url")) return "Create apps/web/.env with DATABASE_URL=\"file:./dev.db\".";
  if (lower.includes("no such column") || lower.includes("no such table") || lower.includes("does not exist")) return "Run pnpm db:migrate and restart pnpm dev.";
  if (lower.includes("prisma client") || lower.includes("unknown arg")) return "Run pnpm db:generate and restart pnpm dev.";
  return "Check the terminal running pnpm dev for the full backend stack trace.";
}

function buildSourceNote(input: MarkAppliedPayload) {
  const lines = [
    clean(input.notes),
    input.resumeLabel ? `Resume used: ${input.resumeLabel}` : undefined,
    input.applicationSourceType && input.applicationSourceType !== "unknown" ? `Application source: ${input.applicationSourceType}` : undefined,
    input.recruiterName ? `Recruiter: ${input.recruiterName}` : undefined,
    input.recruiterCompany ? `Recruiter firm: ${input.recruiterCompany}` : undefined,
    input.recruiterNotes ? `Recruiter notes: ${input.recruiterNotes}` : undefined,
  ].filter(Boolean);
  return lines.join("\n");
}

function mergeNotes(existingNotes: string | null | undefined, newNotes: string) {
  if (!newNotes) return existingNotes;
  if (!existingNotes) return newNotes;
  if (existingNotes.includes(newNotes)) return existingNotes;
  return `${existingNotes}\n\n${newNotes}`;
}

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
