export function calculateResearchPriority(input: {
  applicationStatus?: string | null;
  candidateStatus?: string | null;
  fitScore?: number | null;
  salaryListed?: boolean | null;
  workArrangement?: string | null;
  profileCompletenessScore?: number | null;
  manualPriority?: boolean;
  taskType?: string;
}) {
  let priority = 0;
  const status = input.applicationStatus || input.candidateStatus || "";

  if (status === "interview_requested") priority += 100;
  else if (status === "assessment_requested") priority += 80;
  else if (status === "applied") priority += 50;
  else if (status === "interested") priority += 35;
  else if (status === "sourced") priority += 15;
  else if (status === "skipped") priority -= 100;

  priority += Math.min(100, Math.max(0, input.fitScore || 0));
  if (input.salaryListed) priority += 10;
  if (input.workArrangement === "remote") priority += 10;
  if (input.workArrangement === "hybrid") priority += 4;
  if (input.manualPriority) priority += 50;
  if (input.taskType === "interview_deep_research") priority += 75;
  if (input.taskType === "baseline_company_profile") priority += 10;

  if (typeof input.profileCompletenessScore === "number") {
    if (input.profileCompletenessScore >= 85) priority -= 25;
    else if (input.profileCompletenessScore < 50) priority += 25;
  }

  return Math.max(0, Math.round(priority));
}
