import { normalizeText } from "@/lib/utils";

export type DuplicateCandidate = {
  id: string;
  companyName: string;
  roleTitle: string;
  jobUrl?: string | null;
  sourceJobId?: string | null;
  location?: string | null;
  status?: string;
};

export function findLikelyDuplicate(
  captured: {
    companyName?: string;
    roleTitle?: string;
    jobUrl?: string;
    sourceJobId?: string;
    location?: string;
  },
  existing: DuplicateCandidate[]
) {
  for (const item of existing) {
    if (captured.jobUrl && item.jobUrl && captured.jobUrl === item.jobUrl) {
      return { matchType: "exact_url", confidence: 1, item };
    }
    if (captured.sourceJobId && item.sourceJobId && captured.sourceJobId === item.sourceJobId) {
      return { matchType: "source_job_id", confidence: 0.98, item };
    }
  }

  const company = normalizeText(captured.companyName);
  const role = normalizeText(captured.roleTitle);
  const location = normalizeText(captured.location);

  for (const item of existing) {
    const sameCompany = company && company === normalizeText(item.companyName);
    const sameRole = role && role === normalizeText(item.roleTitle);
    const sameLocation = !location || !item.location || location === normalizeText(item.location);
    if (sameCompany && sameRole && sameLocation) {
      return { matchType: "possible_match", confidence: sameLocation ? 0.86 : 0.76, item };
    }
  }

  return null;
}
