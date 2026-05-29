import { scoreCandidateJob } from "./scorer";
import { DEFAULT_JOB_SEARCH_PROFILE } from "@/lib/profile/default-profile";
import type { JobSearchProfileValues } from "@/lib/profile/profile-utils";

type CandidateJobLike = {
  companyName: string;
  roleTitle: string;
  location?: string | null;
  salaryText?: string | null;
  salaryListed?: boolean;
  rawCardText?: string | null;
  rawDescription?: string | null;
  requiredTechnologies?: string | null;
  emphasisAreas?: string | null;
  riskFlags?: string | null;
};

export function analyzeCandidateJobHeuristically(
  job: CandidateJobLike,
  profile: JobSearchProfileValues = DEFAULT_JOB_SEARCH_PROFILE,
) {
  // Tech the candidate already has counts as a "match"; gap tech (learning)
  // surfaces as something to shore up. Both come from the editable profile.
  const profileCoreTech = unique([...profile.strongTechnologies, ...profile.secondaryTechnologies]);
  const commonGaps = profile.learningTechnologies;

  const text = [job.companyName, job.roleTitle, job.location, job.salaryText, job.rawCardText, job.rawDescription].filter(Boolean).join("\n");
  const baseScore = scoreCandidateJob({
    companyName: job.companyName,
    roleTitle: job.roleTitle,
    location: job.location || undefined,
    salaryText: job.salaryText,
    rawCardText: job.rawCardText || undefined,
    rawDescription: job.rawDescription || undefined,
  }, profile);

  const requiredTechnologies = unique([...parseList(job.requiredTechnologies), ...baseScore.detectedTechnologies]);
  const emphasisAreas = unique([...parseList(job.emphasisAreas), ...baseScore.emphasisAreas]);
  const riskFlags = unique([...parseList(job.riskFlags), ...baseScore.riskFlags]);
  const matchedTechnologies = requiredTechnologies.filter((tech) => profileCoreTech.some((profileTech) => normalize(profileTech) === normalize(tech)));
  const missingTechnologies = unique([...requiredTechnologies.filter((tech) => !matchedTechnologies.includes(tech)), ...commonGaps.filter((gap) => text.toLowerCase().includes(gap.toLowerCase()) && !matchedTechnologies.includes(gap))]);
  const likelyDayToDay = inferLikelyDayToDay(text, requiredTechnologies, emphasisAreas);
  const seniorityLevel = inferSeniority(job.roleTitle, text);

  return {
    overallFitScore: baseScore.fitScore,
    techMatchScore: scoreTechMatch(requiredTechnologies, matchedTechnologies),
    seniorityFitScore: scoreSeniority(seniorityLevel),
    compensationScore: job.salaryListed || job.salaryText ? 90 : 45,
    requiredTechnologies,
    preferredTechnologies: [],
    matchedTechnologies,
    missingTechnologies,
    emphasisAreas,
    likelyDayToDay,
    riskFlags,
    interviewPrepTopics: buildInterviewPrepTopics(requiredTechnologies, emphasisAreas, missingTechnologies),
    workArrangement: baseScore.workArrangement,
    employmentType: baseScore.employmentType,
    seniorityLevel,
    reportingLine: inferReportingLine(text),
    resumePositioning: buildResumePositioning(matchedTechnologies, missingTechnologies),
    summary: buildSummary(job, likelyDayToDay, riskFlags),
  };
}

function inferLikelyDayToDay(text: string, tech: string[], emphasis: string[]) {
  const items: string[] = [];
  if (tech.includes("React") || tech.includes("Next.js")) items.push("Build and maintain React/Next.js product features.");
  if (tech.includes("GraphQL") || tech.includes("Apollo")) items.push("Work with GraphQL data flows and client-side cache behavior.");
  if (emphasis.includes("performance")) items.push("Improve frontend performance, Core Web Vitals, and page speed.");
  if (emphasis.includes("testing")) items.push("Write and maintain unit/integration tests.");
  if (emphasis.includes("architecture")) items.push("Contribute to frontend architecture and reusable systems.");
  if (/mentor|junior engineer/i.test(text)) items.push("Mentor or support junior engineers.");
  if (items.length === 0) items.push("Build product features and collaborate across product, design, and engineering.");
  return unique(items);
}

function inferSeniority(roleTitle: string, text: string) {
  const value = `${roleTitle} ${text}`.toLowerCase();
  if (value.includes("principal")) return "principal";
  if (value.includes("staff")) return "staff";
  if (value.includes("lead")) return "lead";
  if (value.includes("senior") || value.includes("sr.")) return "senior";
  if (value.includes("junior") || value.includes("entry")) return "junior";
  return "unknown";
}

function inferReportingLine(text: string) {
  const match = text.match(/report(?:s|ing)? to (?:our |the )?([^\.\n]+)/i);
  return match?.[1]?.trim() || null;
}

function scoreTechMatch(required: string[], matched: string[]) {
  if (required.length === 0) return 50;
  return Math.round((matched.length / required.length) * 100);
}

function scoreSeniority(level: string) {
  if (["senior", "lead"].includes(level)) return 85;
  if (level === "staff") return 70;
  if (level === "principal") return 55;
  if (level === "junior") return 35;
  return 60;
}

function buildInterviewPrepTopics(required: string[], emphasis: string[], missing: string[]) {
  return unique([...required.slice(0, 6).map((tech) => `Prepare examples using ${tech}.`), ...emphasis.map((area) => `Prepare a story about ${area}.`), ...missing.slice(0, 4).map((skill) => `Review gap area: ${skill}.`)]);
}

function buildResumePositioning(matched: string[], missing: string[]) {
  const lead = matched.length ? `Lead with ${matched.slice(0, 5).join(", ")}.` : "Lead with frontend product delivery and React/Next.js project experience.";
  const gap = missing.length ? `Be ready to address gaps around ${missing.slice(0, 3).join(", ")}.` : "Tech stack alignment looks strong.";
  return `${lead} ${gap}`;
}

function buildSummary(job: CandidateJobLike, dayToDay: string[], riskFlags: string[]) {
  return `${job.companyName} is hiring for ${job.roleTitle}. Likely work: ${dayToDay.slice(0, 2).join(" ")} ${riskFlags.length ? `Main cautions: ${riskFlags.slice(0, 2).join(", ")}.` : ""}`.trim();
}

function parseList(value?: string | null): string[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []; } catch { return []; }
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").replace(/\s+/g, " ").trim();
}
