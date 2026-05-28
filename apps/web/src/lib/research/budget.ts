import { prisma } from "@/lib/prisma";
import { getTodayDateKey } from "./date-key";
import { researchConfig } from "./research-config";

export type BudgetCategory = "baseline" | "followup" | "interview_manual";

export async function getResearchBudgetSnapshot(dateKey = getTodayDateKey()) {
  const ledger = await prisma.aiBudgetLedger.findMany({
    where: { dateKey, provider: researchConfig.provider, model: researchConfig.researchModel, searchUsed: true },
  });

  const usedTotal = sum(ledger.map((row) => row.searchRequests));
  const usedBaseline = sum(ledger.filter((row) => row.budgetCategory === "baseline").map((row) => row.searchRequests));
  const usedFollowup = sum(ledger.filter((row) => row.budgetCategory === "followup").map((row) => row.searchRequests));
  const usedInterview = sum(ledger.filter((row) => row.budgetCategory === "interview_manual").map((row) => row.searchRequests));
  const queued = await prisma.researchTask.count({ where: { status: "queued" } });

  return {
    dateKey,
    provider: researchConfig.provider,
    model: researchConfig.researchModel,
    searchEnabled: researchConfig.searchEnabled,
    total: { limit: researchConfig.dailySearchBudget, used: usedTotal, remaining: Math.max(0, researchConfig.dailySearchBudget - usedTotal) },
    baseline: { limit: researchConfig.baselineDailyBudget, used: usedBaseline, remaining: Math.max(0, researchConfig.baselineDailyBudget - usedBaseline) },
    followup: { limit: researchConfig.followupDailyBudget, used: usedFollowup, remaining: Math.max(0, researchConfig.followupDailyBudget - usedFollowup) },
    interviewManual: { limit: researchConfig.interviewDailyBudget, used: usedInterview, remaining: Math.max(0, researchConfig.interviewDailyBudget - usedInterview) },
    queued,
  };
}

export async function canSpendResearchBudget(category: BudgetCategory, requestedSearches: number) {
  const snapshot = await getResearchBudgetSnapshot();
  if (snapshot.total.remaining < requestedSearches) return { ok: false, reason: "Daily search budget exhausted", snapshot };
  const bucket = category === "baseline" ? snapshot.baseline : category === "followup" ? snapshot.followup : snapshot.interviewManual;
  if (bucket.remaining < requestedSearches) return { ok: false, reason: `${category} budget exhausted`, snapshot };
  return { ok: true, reason: null, snapshot };
}

export async function recordSearchSpend(input: { feature: string; budgetCategory: BudgetCategory; searchRequests: number; researchTaskId?: string; candidateJobId?: string; applicationId?: string }) {
  return prisma.aiBudgetLedger.create({
    data: {
      dateKey: getTodayDateKey(),
      provider: researchConfig.provider,
      model: researchConfig.researchModel,
      feature: input.feature,
      budgetCategory: input.budgetCategory,
      searchUsed: input.searchRequests > 0,
      searchRequests: input.searchRequests,
      estimatedCost: 0,
      researchTaskId: input.researchTaskId,
      candidateJobId: input.candidateJobId,
      applicationId: input.applicationId,
    },
  });
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
