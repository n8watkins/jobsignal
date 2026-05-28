export type CompanyProfileDraft = {
  companyName: string;
  officialWebsite?: string | null;
  summary?: string | null;
  productCategory?: string | null;
  customerSegment?: string | null;
  companySize?: string | null;
  companyStage?: string | null;
  hiringSignalScore?: number | null;
  riskScore?: number | null;
  sourceQualityScore?: number | null;
  keySources?: string[];
  riskFlags?: string[];
};

const REQUIRED_FIELDS = ["summary", "officialWebsite", "productCategory", "customerSegment", "companySize", "companyStage", "hiringSignalScore", "sourceQualityScore"];

export function evaluateCompanyProfile(profile: CompanyProfileDraft) {
  const missingFields: string[] = [];
  const partialFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = (profile as any)[field];
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) missingFields.push(field);
  }

  if ((profile.keySources || []).length === 0) missingFields.push("keySources");
  if ((profile.keySources || []).length > 0 && (profile.keySources || []).length < 3) partialFields.push("keySources");

  const total = REQUIRED_FIELDS.length + 1;
  const score = Math.max(0, Math.round(((total - missingFields.length - partialFields.length * 0.5) / total) * 100));

  return {
    profileCompletenessScore: score,
    missingFields: unique(missingFields),
    partialFields: unique(partialFields),
    sourceQualityScore: profile.sourceQualityScore ?? inferSourceQuality(profile.keySources || []),
  };
}

export function generateFollowupTasksFromProfile(input: { companyName: string; applicationId?: string | null; candidateJobId?: string | null; profileCompletenessScore?: number | null; missingFields: string[]; fitScore?: number | null }) {
  const tasks: Array<{ companyName: string; applicationId?: string | null; candidateJobId?: string | null; taskType: string; budgetCategory: "followup"; priority: number; reason: string; searchCostEstimate: number }> = [];
  const has = (field: string) => input.missingFields.includes(field);

  if (has("companySize") || has("companyStage")) tasks.push(makeTask(input, "company_size_stage_check", "Company size/stage is missing or low-confidence.", 20));
  if (has("hiringSignalScore")) tasks.push(makeTask(input, "hiring_signal_check", "Hiring signal is missing or low-confidence.", 25));
  if (has("sourceQualityScore") || has("keySources")) tasks.push(makeTask(input, "source_quality_check", "Source quality is weak or insufficient.", 15));
  if (has("summary") || has("productCategory") || has("customerSegment")) tasks.push(makeTask(input, "company_identity_product_check", "Company identity/product details are incomplete.", 18));

  return tasks;
}

function makeTask(input: { companyName: string; applicationId?: string | null; candidateJobId?: string | null; profileCompletenessScore?: number | null; fitScore?: number | null }, taskType: string, reason: string, boost: number) {
  return {
    companyName: input.companyName,
    applicationId: input.applicationId,
    candidateJobId: input.candidateJobId,
    taskType,
    budgetCategory: "followup" as const,
    priority: followupPriority(input, boost),
    reason,
    searchCostEstimate: 1,
  };
}

function followupPriority(input: { profileCompletenessScore?: number | null; fitScore?: number | null }, boost: number) {
  const fit = input.fitScore || 0;
  const completeness = input.profileCompletenessScore ?? 0;
  const gapBoost = completeness < 50 ? 30 : completeness < 75 ? 15 : 0;
  return Math.round(fit + gapBoost + boost);
}

function inferSourceQuality(sources: string[]) {
  if (sources.some((source) => /official|company site|careers|press release/i.test(source))) return 85;
  if (sources.some((source) => /linkedin|news|funding/i.test(source))) return 65;
  if (sources.length > 0) return 45;
  return 20;
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
