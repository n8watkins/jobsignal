import { prisma } from "@/lib/prisma";
import { researchConfig } from "./research-config";
import { calculateResearchPriority } from "./priority";

export async function queueBaselineResearchForApplication(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { jobPosting: true, candidateJob: true },
  });

  if (!application) throw new Error("Application not found");

  const companyName = application.jobPosting?.companyName || application.candidateJob?.companyName;
  if (!companyName) throw new Error("Application has no company name");

  const existingTask = await prisma.researchTask.findFirst({
    where: {
      applicationId,
      companyName,
      taskType: "baseline_company_profile",
      status: { in: ["queued", "running", "completed", "deferred"] },
    },
  });
  if (existingTask) return existingTask;

  const existingProfile = await prisma.companyProfile.findUnique({ where: { companyName } });
  const priority = calculateResearchPriority({
    applicationStatus: application.status,
    candidateStatus: application.candidateJob?.status,
    fitScore: application.candidateJob?.fitScore,
    salaryListed: application.jobPosting?.salaryListed || application.candidateJob?.salaryListed,
    workArrangement: application.candidateJob?.workArrangement,
    profileCompletenessScore: existingProfile?.profileCompletenessScore,
    taskType: "baseline_company_profile",
  });

  return prisma.researchTask.create({
    data: {
      companyName,
      applicationId,
      candidateJobId: application.candidateJobId,
      taskType: "baseline_company_profile",
      budgetCategory: "baseline",
      priority,
      status: "queued",
      reason: "Application submitted; baseline company research queued.",
      searchCostEstimate: researchConfig.baselineSearchesPerCompany,
      prompt: buildBaselinePrompt(companyName, application.jobPosting?.roleTitle || application.candidateJob?.roleTitle),
    },
  });
}

export async function queueBaselineResearchForAppliedApplications() {
  const applications = await prisma.application.findMany({
    where: { status: { in: ["applied", "interview_requested", "assessment_requested"] } },
    include: { jobPosting: true, candidateJob: true },
    orderBy: { appliedAt: "desc" },
    take: 250,
  });

  const queued = [];
  for (const application of applications) {
    try {
      queued.push(await queueBaselineResearchForApplication(application.id));
    } catch {
      // Skip malformed applications.
    }
  }
  return queued;
}

export async function getResearchQueue(limit = 50) {
  return prisma.researchTask.findMany({
    where: { status: { in: ["queued", "deferred", "failed"] } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
  });
}

function buildBaselinePrompt(companyName: string, roleTitle?: string | null) {
  return [
    `Research company profile for: ${companyName}`,
    roleTitle ? `Relevant role: ${roleTitle}` : null,
    "Baseline package should cover: company/product, hiring/health, role/engineering/interview relevance.",
  ].filter(Boolean).join("\n");
}
