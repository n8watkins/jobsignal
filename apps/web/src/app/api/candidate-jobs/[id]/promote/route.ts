import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueBaselineResearchForApplication } from "@/lib/research/queue";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const candidateJob = await prisma.candidateJob.findUnique({ where: { id } });
    if (!candidateJob) return NextResponse.json({ ok: false, error: "Candidate job not found" }, { status: 404 });

    const canonicalCompanyName = normalize(candidateJob.companyName);
    const canonicalRoleTitle = normalize(candidateJob.roleTitle);

    const jobPosting = await findOrCreateJobPosting({ candidateJob, canonicalCompanyName, canonicalRoleTitle });
    const existingApplication = await prisma.application.findFirst({
      where: { OR: [{ candidateJobId: candidateJob.id }, { jobPostingId: jobPosting.id }] },
    });

    const application = existingApplication
      ? await prisma.application.update({
          where: { id: existingApplication.id },
          data: {
            status: existingApplication.status === "rejected" ? existingApplication.status : "applied",
            candidateJobId: candidateJob.id,
            appliedAt: existingApplication.appliedAt || new Date(),
          },
        })
      : await prisma.application.create({
          data: {
            userId: candidateJob.userId,
            jobPostingId: jobPosting.id,
            candidateJobId: candidateJob.id,
            status: "applied",
            source: candidateJob.source,
            applicationMethod: "manual_from_radar",
            appliedAt: new Date(),
            notes: "Marked applied from Job Radar.",
          },
        });

    await prisma.candidateJob.update({ where: { id: candidateJob.id }, data: { status: "applied" } });
    await prisma.applicationEvent.create({
      data: {
        userId: candidateJob.userId,
        applicationId: application.id,
        type: existingApplication ? "manual_update" : "applied",
        title: existingApplication ? "Application updated from Job Radar" : "Applied from Job Radar",
        description: `Promoted ${candidateJob.companyName} ${candidateJob.roleTitle} from Job Radar`,
        metadata: JSON.stringify({ candidateJobId: candidateJob.id, source: candidateJob.source, sourceJobId: candidateJob.sourceJobId, jobUrl: candidateJob.jobUrl }),
        occurredAt: new Date(),
      },
    });

    let researchTaskQueued = false;
    try {
      await queueBaselineResearchForApplication(application.id);
      researchTaskQueued = true;
    } catch (queueError) {
      console.warn("[candidate-job-promote] research queue skipped", queueError);
    }

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      candidateJobId: candidateJob.id,
      researchTaskQueued,
      applicationUrl: `/applications/${application.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function findOrCreateJobPosting(input: {
  candidateJob: NonNullable<Awaited<ReturnType<typeof prisma.candidateJob.findUnique>>>;
  canonicalCompanyName: string;
  canonicalRoleTitle: string;
}) {
  const { candidateJob, canonicalCompanyName, canonicalRoleTitle } = input;
  const orConditions = [
    candidateJob.sourceJobId ? { sourceJobId: candidateJob.sourceJobId } : null,
    candidateJob.jobUrl ? { jobUrl: candidateJob.jobUrl } : null,
    { canonicalCompanyName, canonicalRoleTitle },
  ].filter(Boolean) as Array<{ sourceJobId?: string; jobUrl?: string; canonicalCompanyName?: string; canonicalRoleTitle?: string }>;

  const existing = await prisma.jobPosting.findFirst({
    where: {
      userId: candidateJob.userId,
      OR: orConditions,
    },
  });

  if (existing) return existing;

  return prisma.jobPosting.create({
    data: {
      userId: candidateJob.userId,
      companyName: candidateJob.companyName,
      roleTitle: candidateJob.roleTitle,
      canonicalCompanyName,
      canonicalRoleTitle,
      jobUrl: candidateJob.jobUrl,
      source: candidateJob.source,
      sourceJobId: candidateJob.sourceJobId,
      rawDescription: candidateJob.rawDescription,
      location: candidateJob.location,
      workplaceType: candidateJob.workArrangement,
      employmentType: candidateJob.employmentType,
      salaryText: candidateJob.salaryText,
      salaryListed: candidateJob.salaryListed,
      requiredSkills: candidateJob.requiredTechnologies,
      niceToHaveSkills: candidateJob.preferredTechnologies,
      techStack: candidateJob.requiredTechnologies,
      redFlags: candidateJob.riskFlags,
      extractedConfidence: 0.8,
    },
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
