import { getExtensionConfig, buildHeaders } from "./api";
import type { LinkedInJobCard, ScoredLinkedInJobCard } from "./candidateJobTypes";

export async function scoreVisibleCandidateJobs(jobs: LinkedInJobCard[]): Promise<ScoredLinkedInJobCard[]> {
  const { apiBase, sharedSecret } = await getExtensionConfig();
  const response = await fetch(`${apiBase}/api/candidate-jobs/score-visible`, {
    method: "POST",
    headers: buildHeaders(sharedSecret),
    body: JSON.stringify({ jobs }),
  });
  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(`JobSignal scoring error ${response.status}`);
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

export async function saveCandidateJob(job: LinkedInJobCard) {
  const { apiBase, sharedSecret } = await getExtensionConfig();
  const response = await fetch(`${apiBase}/api/candidate-jobs`, {
    method: "POST",
    headers: buildHeaders(sharedSecret),
    body: JSON.stringify(job),
  });
  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;
  if (!response.ok) throw new Error(`JobSignal save candidate error ${response.status}`);
  return data?.candidateJob;
}

function safeJsonParse(text: string) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
