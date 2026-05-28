import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CapturedJobSchema } from "@jobsignal/shared";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";
import { queueBaselineResearchForApplication } from "@/lib/research/queue";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

export async function GET() {
  const user = await getUser();
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
    include: { jobPosting: true },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CapturedJobSchema.safeParse({
    source: body.source || "manual",
    companyName: body.companyName,
    roleTitle: body.roleTitle,
    jobUrl: body.jobUrl || undefined,
    location: body.location || undefined,
    rawDescription: body.rawDescription || undefined,
    salaryListed: Boolean(body.salaryText),
    salaryText: body.salaryText || null,
    applicationMethod: body.applicationMethod || "manual",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const extraction = await extractJobDescription(parsed.data);
  const analysis = await analyzeJobFit({ rawDescription: parsed.data.rawDescription, extraction });

  const user = await getUser();
  const appliedAt = new Date();
  const companyName = parsed.data.companyName || extraction.companyName || "Unknown Company";
  const roleTitle = parsed.data.roleTitle || extraction.roleTitle || "Unknown Role";

  const result = await prisma.$transaction(async (tx) => {
    const jobPosting = await tx.jobPosting.create({
      data: {
        userId: user.id,
        companyName,
        roleTitle,
        canonicalCompanyName: normalize(companyName),
        canonicalRoleTitle: normalize(roleTitle),
        jobUrl: parsed.data.jobUrl,
        source: parsed.data.source,
        rawDescription: parsed.data.rawDescription,
        location: parsed.data.location,
        workplaceType: extraction.workplaceType,
        employmentType: extraction.employmentType,
        salaryText: extraction.salaryText,
        salaryListed: extraction.salaryListed,
        seniorityLevel: extraction.seniorityLevel,
        requiredSkills: JSON.stringify(extraction.requiredSkills),
        niceToHaveSkills: JSON.stringify(extraction.niceToHaveSkills),
        techStack: JSON.stringify(extraction.techStack),
        responsibilities: JSON.stringify(extraction.responsibilities),
        benefits: JSON.stringify(extraction.benefits),
        redFlags: JSON.stringify(extraction.redFlags),
        extractedConfidence: extraction.confidence,
      },
    });

    const application = await tx.application.create({
      data: {
        userId: user.id,
        jobPostingId: jobPosting.id,
        status: "applied",
        source: parsed.data.source,
        applicationMethod: parsed.data.applicationMethod,
        appliedAt,
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

    await tx.applicationEvent.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        type: "applied",
        title: "Applied",
        description: `Manually added via web app`,
        occurredAt: appliedAt,
      },
    });

    return { jobPosting, application };
  });

  try {
    await queueBaselineResearchForApplication(result.application.id);
  } catch (err) {
    console.warn("[applications] research queue skipped", err);
  }

  return NextResponse.json({
    ok: true,
    applicationId: result.application.id,
    applicationUrl: `/applications/${result.application.id}`,
  });
}

async function getUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: DEFAULT_USER_NAME },
    create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
