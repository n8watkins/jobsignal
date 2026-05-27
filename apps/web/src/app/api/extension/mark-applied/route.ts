import { NextResponse } from "next/server";
import { MarkAppliedRequestSchema } from "@jobsignal/shared";
import { analyzeJobFit, extractJobDescription } from "@/lib/ai/analyze-job";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = MarkAppliedRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const extraction = await extractJobDescription(input);
  const analysis = await analyzeJobFit({ rawDescription: input.rawDescription, extraction });

  const companyName = firstNonEmpty(input.companyName, extraction.companyName, "Unknown Company");
  const roleTitle = firstNonEmpty(input.roleTitle, extraction.roleTitle, "Unknown Role");
  const appliedAt = input.appliedAt ? new Date(input.appliedAt) : new Date();
  const salaryText = input.salaryText || extraction.salaryText || null;
  const salaryListed = Boolean(input.salaryListed || extraction.salaryListed || salaryText);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: { name: DEFAULT_USER_NAME },
      create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
    });

    const resumeVersion = input.resumeVersionId
      ? await tx.resumeVersion.findFirst({ where: { id: input.resumeVersionId, userId: user.id } })
      : null;

    const existingJobPosting = await findExistingJobPosting(tx, {
      userId: user.id,
      source: input.source,
      sourceJobId: input.sourceJobId,
      jobUrl: input.jobUrl,
      companyName,
      roleTitle,
    });

    const jobPosting = existingJobPosting
      ? await tx.jobPosting.update({
          where: { id: existingJobPosting.id },
          data: {
            companyName,
            roleTitle,
            canonicalCompanyName: normalize(companyName),
            canonicalRoleTitle: normalize(roleTitle),
            jobUrl: input.jobUrl || existingJobPosting.jobUrl,
            source: input.source || existingJobPosting.source,
            sourceJobId: input.sourceJobId || existingJobPosting.sourceJobId,
            rawDescription: input.rawDescription || existingJobPosting.rawDescription,
            location: input.location || extraction.location || existingJobPosting.location,
            workplaceType: input.workplaceType || extraction.workplaceType || existingJobPosting.workplaceType,
            employmentType: input.employmentType || extraction.employmentType || existingJobPosting.employmentType,
            salaryText,
            salaryListed,
            seniorityLevel: extraction.seniorityLevel,
            requiredSkills: JSON.stringify(extraction.requiredSkills),
            niceToHaveSkills: JSON.stringify(extraction.niceToHaveSkills),
            techStack: JSON.stringify(extraction.techStack),
            responsibilities: JSON.stringify(extraction.responsibilities),
            benefits: JSON.stringify(extraction.benefits),
            redFlags: JSON.stringify(extraction.redFlags),
            extractedConfidence: extraction.confidence,
          },
        })
      : await tx.jobPosting.create({
          data: {
            userId: user.id,
            companyName,
            roleTitle,
            canonicalCompanyName: normalize(companyName),
            canonicalRoleTitle: normalize(roleTitle),
            jobUrl: input.jobUrl,
            source: input.source,
            sourceJobId: input.sourceJobId,
            rawDescription: input.rawDescription,
            location: input.location || extraction.location || undefined,
            workplaceType: input.workplaceType || extraction.workplaceType || "unknown",
            employmentType: input.employmentType || extraction.employmentType || "unknown",
            salaryText,
            salaryListed,
            seniorityLevel: extraction.seniorityLevel || undefined,
            requiredSkills: JSON.stringify(extraction.requiredSkills),
            niceToHaveSkills: JSON.stringify(extraction.niceToHaveSkills),
            techStack: JSON.stringify(extraction.techStack),
            responsibilities: JSON.stringify(extraction.responsibilities),
            benefits: JSON.stringify(extraction.benefits),
            redFlags: JSON.stringify(extraction.redFlags),
            extractedConfidence: extraction.confidence,
          },
        });

    const existingApplication = await tx.application.findUnique({
      where: { jobPostingId: jobPosting.id },
    });

    const application = existingApplication
      ? await tx.application.update({
          where: { id: existingApplication.id },
          data: {
            status: existingApplication.status === "rejected" ? existingApplication.status : "applied",
            source: input.source,
            applicationMethod: input.applicationMethod || "linkedin_easy_apply",
            appliedAt: existingApplication.appliedAt || appliedAt,
            resumeVersionId: resumeVersion?.id,
            notes: input.notes || existingApplication.notes,
          },
        })
      : await tx.application.create({
          data: {
            userId: user.id,
            jobPostingId: jobPosting.id,
            status: "applied",
            source: input.source,
            applicationMethod: input.applicationMethod || "linkedin_easy_apply",
            appliedAt,
            resumeVersionId: resumeVersion?.id,
            notes: input.notes,
          },
        });

    await tx.applicationEvent.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        type: existingApplication ? "manual_update" : "applied",
        title: existingApplication ? "Application re-confirmed from extension" : "Applied",
        description: `Marked applied from ${input.source || "browser"}${input.jobUrl ? `: ${input.jobUrl}` : ""}`,
        metadata: JSON.stringify({
          source: input.source,
          sourceJobId: input.sourceJobId,
          jobUrl: input.jobUrl,
          salaryListed,
          salaryText,
        }),
        occurredAt: appliedAt,
      },
    });

    await tx.jobAnalysis.create({
      data: {
        userId: user.id,
        jobPostingId: jobPosting.id,
        fitScore: analysis.fitScore,
        opportunityScore: analysis.opportunityScore,
        roleFitScore: analysis.roleFitScore,
        techStackFitScore: analysis.techStackFitScore,
        compensationClarityScore: analysis.compensationClarityScore,
        strongestMatches: JSON.stringify(analysis.strongestMatches),
        possibleGaps: JSON.stringify(analysis.possibleGaps),
        redFlags: JSON.stringify(analysis.redFlags),
        resumeAngle: analysis.resumeAngle,
        applicationStrategy: analysis.applicationStrategy,
        questionsToAsk: JSON.stringify(analysis.questionsToAsk),
        concerns: JSON.stringify(analysis.concerns),
      },
    });

    return { user, jobPosting, application };
  });

  return NextResponse.json({
    applicationId: result.application.id,
    jobPostingId: result.jobPosting.id,
    status: result.application.status,
    duplicateStatus: "checked",
    analysisQueued: true,
    applicationUrl: `/applications/${result.application.id}`,
    extraction,
    analysis,
  });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function findExistingJobPosting(
  tx: Tx,
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

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim().length > 0)?.trim() || "";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
