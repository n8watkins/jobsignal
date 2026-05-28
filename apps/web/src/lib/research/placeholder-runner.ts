import { prisma } from "@/lib/prisma";
import { canSpendResearchBudget, recordSearchSpend } from "./budget";
import { evaluateCompanyProfile, generateFollowupTasksFromProfile } from "./profile-evaluator";

export async function runPlaceholderResearchTask(taskId: string) {
  const task = await prisma.researchTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Research task not found");
  if (task.status === "completed") return { task, profile: null, skipped: true, reason: "Task already completed" };

  const budgetCheck = await canSpendResearchBudget(task.budgetCategory as any, task.searchCostEstimate);
  if (!budgetCheck.ok) {
    const deferred = await prisma.researchTask.update({ where: { id: task.id }, data: { status: "deferred" } });
    return { task: deferred, profile: null, skipped: true, reason: budgetCheck.reason };
  }

  await prisma.researchTask.update({ where: { id: task.id }, data: { status: "running", attempts: { increment: 1 }, startedAt: new Date() } });

  const draft = {
    companyName: task.companyName,
    officialWebsite: null,
    summary: `${task.companyName} needs Gemini Search research. Placeholder profile created for pipeline testing.`,
    productCategory: null,
    customerSegment: null,
    companySize: null,
    companyStage: null,
    hiringSignalScore: null,
    riskScore: 50,
    sourceQualityScore: 20,
    keySources: [],
    riskFlags: ["Placeholder research only", "No real sources collected yet"],
  };

  const evaluation = evaluateCompanyProfile(draft);
  const profile = await prisma.companyProfile.upsert({
    where: { companyName: task.companyName },
    update: {
      officialWebsite: draft.officialWebsite,
      summary: draft.summary,
      productCategory: draft.productCategory,
      customerSegment: draft.customerSegment,
      companySize: draft.companySize,
      companyStage: draft.companyStage,
      hiringSignalScore: draft.hiringSignalScore,
      riskScore: draft.riskScore,
      sourceQualityScore: evaluation.sourceQualityScore,
      profileCompletenessScore: evaluation.profileCompletenessScore,
      missingFields: JSON.stringify(evaluation.missingFields),
      riskFlags: JSON.stringify(draft.riskFlags),
      keySources: JSON.stringify(draft.keySources),
      researchStatus: "placeholder_complete",
      lastResearchedAt: new Date(),
    },
    create: {
      companyName: task.companyName,
      officialWebsite: draft.officialWebsite,
      summary: draft.summary,
      productCategory: draft.productCategory,
      customerSegment: draft.customerSegment,
      companySize: draft.companySize,
      companyStage: draft.companyStage,
      hiringSignalScore: draft.hiringSignalScore,
      riskScore: draft.riskScore,
      sourceQualityScore: evaluation.sourceQualityScore,
      profileCompletenessScore: evaluation.profileCompletenessScore,
      missingFields: JSON.stringify(evaluation.missingFields),
      riskFlags: JSON.stringify(draft.riskFlags),
      keySources: JSON.stringify(draft.keySources),
      researchStatus: "placeholder_complete",
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

  const completedTask = await prisma.researchTask.update({ where: { id: task.id }, data: { status: "completed", resultQualityScore: evaluation.sourceQualityScore, completedAt: new Date() } });
  const followups = [];
  const followupInputs = generateFollowupTasksFromProfile({
    companyName: task.companyName,
    applicationId: task.applicationId,
    candidateJobId: task.candidateJobId,
    profileCompletenessScore: evaluation.profileCompletenessScore,
    missingFields: evaluation.missingFields,
  });

  for (const followup of followupInputs) {
    const existing = await prisma.researchTask.findFirst({
      where: {
        companyName: followup.companyName,
        applicationId: followup.applicationId || undefined,
        candidateJobId: followup.candidateJobId || undefined,
        taskType: followup.taskType,
        status: { in: ["queued", "running", "completed", "deferred"] },
      },
    });
    if (existing) continue;
    followups.push(await prisma.researchTask.create({ data: { ...followup, status: "queued" } }));
  }

  return { task: completedTask, profile, followups, skipped: false, reason: null };
}
