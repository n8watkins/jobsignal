import { prisma } from "@/lib/prisma";
import { canSpendResearchBudget, recordSearchSpend } from "./budget";
import { evaluateCompanyProfile } from "./profile-evaluator";
import { runGeminiCompanyResearch } from "./gemini-company-research";

export async function runGeminiResearchTask(taskId: string) {
  const task = await prisma.researchTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Research task not found");
  if (task.status === "completed") return { task, profile: null, skipped: true, reason: "Task already completed" };

  const budgetCheck = await canSpendResearchBudget(task.budgetCategory as any, task.searchCostEstimate);
  if (!budgetCheck.ok) {
    const deferred = await prisma.researchTask.update({ where: { id: task.id }, data: { status: "deferred" } });
    return { task: deferred, profile: null, skipped: true, reason: budgetCheck.reason };
  }

  await prisma.researchTask.update({
    where: { id: task.id },
    data: { status: "running", attempts: { increment: 1 }, startedAt: new Date() },
  });

  try {
    const context = await getResearchContext(task);
    const geminiResult = await runGeminiCompanyResearch({ task, context });

    const evaluation = evaluateCompanyProfile({
      companyName: geminiResult.profile.companyName,
      officialWebsite: geminiResult.profile.officialWebsite,
      summary: geminiResult.profile.summary,
      productCategory: geminiResult.profile.productCategory,
      customerSegment: geminiResult.profile.customerSegment,
      companySize: geminiResult.profile.companySize,
      companyStage: geminiResult.profile.companyStage,
      hiringSignalScore: geminiResult.profile.hiringSignalScore,
      riskScore: geminiResult.profile.riskScore,
      sourceQualityScore: geminiResult.profile.sourceQualityScore,
      keySources: geminiResult.profile.keySources.map((source) => `${source.title} ${source.uri}`),
      riskFlags: geminiResult.profile.riskFlags,
    });

    const missingFields = unique([...geminiResult.profile.missingFields, ...evaluation.missingFields]);

    const profile = await prisma.companyProfile.upsert({
      where: { companyName: task.companyName },
      update: {
        officialWebsite: geminiResult.profile.officialWebsite,
        summary: geminiResult.profile.summary,
        productCategory: geminiResult.profile.productCategory,
        customerSegment: geminiResult.profile.customerSegment,
        companySize: geminiResult.profile.companySize,
        companyStage: geminiResult.profile.companyStage,
        hiringSignalScore: geminiResult.profile.hiringSignalScore,
        riskScore: geminiResult.profile.riskScore,
        sourceQualityScore: evaluation.sourceQualityScore,
        profileCompletenessScore: evaluation.profileCompletenessScore,
        missingFields: JSON.stringify(missingFields),
        riskFlags: JSON.stringify(geminiResult.profile.riskFlags),
        keySources: JSON.stringify(geminiResult.profile.keySources),
        researchStatus: "gemini_complete",
        lastResearchedAt: new Date(),
      },
      create: {
        companyName: task.companyName,
        officialWebsite: geminiResult.profile.officialWebsite,
        summary: geminiResult.profile.summary,
        productCategory: geminiResult.profile.productCategory,
        customerSegment: geminiResult.profile.customerSegment,
        companySize: geminiResult.profile.companySize,
        companyStage: geminiResult.profile.companyStage,
        hiringSignalScore: geminiResult.profile.hiringSignalScore,
        riskScore: geminiResult.profile.riskScore,
        sourceQualityScore: evaluation.sourceQualityScore,
        profileCompletenessScore: evaluation.profileCompletenessScore,
        missingFields: JSON.stringify(missingFields),
        riskFlags: JSON.stringify(geminiResult.profile.riskFlags),
        keySources: JSON.stringify(geminiResult.profile.keySources),
        researchStatus: "gemini_complete",
        lastResearchedAt: new Date(),
      },
    });

    await recordSearchSpend({
      feature: task.taskType,
      budgetCategory: task.budgetCategory as any,
      searchRequests: task.searchCostEstimate,
      researchTaskId: task.id,
      candidateJobId: task.candidateJobId || undefined,
      applicationId: task.applicationId || undefined,
    });

    const completedTask = await prisma.researchTask.update({
      where: { id: task.id },
      data: { status: "completed", resultQualityScore: evaluation.sourceQualityScore, completedAt: new Date() },
    });

    const followups = [];
    for (const followup of geminiResult.profile.recommendedFollowups) {
      const existing = await prisma.researchTask.findFirst({
        where: {
          companyName: task.companyName,
          applicationId: task.applicationId || undefined,
          candidateJobId: task.candidateJobId || undefined,
          taskType: followup.taskType,
          status: { in: ["queued", "running", "completed", "deferred"] },
        },
      });
      if (existing) continue;

      followups.push(
        await prisma.researchTask.create({
          data: {
            companyName: task.companyName,
            applicationId: task.applicationId,
            candidateJobId: task.candidateJobId,
            taskType: followup.taskType,
            budgetCategory: "followup",
            priority: followup.priority,
            status: "queued",
            reason: followup.reason,
            searchCostEstimate: Math.max(1, Math.min(3, followup.searchCostEstimate || 1)),
          },
        }),
      );
    }

    return {
      task: completedTask,
      profile,
      followups,
      webSearchQueries: geminiResult.webSearchQueries,
      groundingSources: geminiResult.groundingSources,
      skipped: false,
      reason: null,
    };
  } catch (error) {
    await prisma.researchTask.update({
      where: { id: task.id },
      data: { status: "failed" },
    });
    throw error;
  }
}

async function getResearchContext(task: any) {
  if (task.applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: task.applicationId },
      include: { jobPosting: true, candidateJob: true },
    });

    if (application) {
      return {
        roleTitle: application.jobPosting?.roleTitle || application.candidateJob?.roleTitle,
        jobDescription: application.jobPosting?.rawDescription || application.candidateJob?.rawDescription,
        jobUrl: application.jobPosting?.jobUrl || application.candidateJob?.jobUrl,
        fitScore: application.candidateJob?.fitScore,
      };
    }
  }

  if (task.candidateJobId) {
    const candidateJob = await prisma.candidateJob.findUnique({ where: { id: task.candidateJobId } });
    if (candidateJob) {
      return {
        roleTitle: candidateJob.roleTitle,
        jobDescription: candidateJob.rawDescription || candidateJob.rawCardText,
        jobUrl: candidateJob.jobUrl,
        fitScore: candidateJob.fitScore,
      };
    }
  }

  return {};
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
