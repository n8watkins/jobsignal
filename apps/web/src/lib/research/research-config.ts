export const researchConfig = {
  provider: process.env.AI_PROVIDER || "gemini",
  researchModel: process.env.AI_RESEARCH_MODEL || "gemini-2.5-flash",
  searchEnabled: process.env.AI_SEARCH_ENABLED === "true",
  dailySearchBudget: Number(process.env.RESEARCH_DAILY_SEARCH_BUDGET || 500),
  baselineDailyBudget: Number(process.env.RESEARCH_BASELINE_DAILY_BUDGET || 300),
  followupDailyBudget: Number(process.env.RESEARCH_FOLLOWUP_DAILY_BUDGET || 125),
  interviewDailyBudget: Number(process.env.RESEARCH_INTERVIEW_DAILY_BUDGET || 75),
  baselineSearchesPerCompany: Number(process.env.RESEARCH_BASELINE_SEARCHES_PER_COMPANY || 3),
  profileStaleDays: Number(process.env.RESEARCH_PROFILE_STALE_DAYS || 30),
};
