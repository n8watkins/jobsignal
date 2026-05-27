import type { JobAnalysis, JobExtraction } from "@jobsignal/shared";

const salaryRegex = /\$\s?\d{2,3}[,kK]?\s?(?:-|to|–)\s?\$?\s?\d{2,3}[,kK]?/i;

export async function extractJobDescription(input: {
  rawDescription?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  salaryText?: string | null;
}): Promise<JobExtraction> {
  const text = input.rawDescription || "";
  const salaryMatch = text.match(salaryRegex)?.[0] || input.salaryText || null;
  const salaryListed = Boolean(salaryMatch);
  const redFlags = salaryListed ? [] : ["No salary listed"];

  // Stub implementation. Replace this with Gemini/OpenAI call returning JobExtractionSchema.
  return {
    companyName: input.companyName || null,
    roleTitle: input.roleTitle || null,
    seniorityLevel: /senior/i.test(text) ? "Senior" : /junior|entry/i.test(text) ? "Junior" : null,
    employmentType: /contract/i.test(text) ? "contract" : "full_time",
    workplaceType: /remote/i.test(text) ? "remote" : /hybrid/i.test(text) ? "hybrid" : "unknown",
    location: input.location || null,
    salaryListed,
    salaryText: salaryMatch,
    requiredSkills: keywordList(text, ["React", "TypeScript", "JavaScript", "Next.js", "Node.js", "SQL", "GraphQL"]),
    niceToHaveSkills: keywordList(text, ["AWS", "Docker", "Prisma", "Supabase", "Firebase", "Testing Library"]),
    techStack: keywordList(text, ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "GraphQL"]),
    responsibilities: ["Build and maintain product features", "Collaborate with product/design/engineering"],
    benefits: keywordList(text, ["health", "dental", "vision", "401k", "remote"]),
    redFlags,
    confidence: 0.68,
  };
}

export async function analyzeJobFit(input: {
  rawDescription?: string;
  resumeText?: string;
  extraction: JobExtraction;
}): Promise<JobAnalysis> {
  const required = input.extraction.requiredSkills;
  const resume = input.resumeText || "React Next.js TypeScript dashboard API automation";
  const matches = required.filter((skill) => resume.toLowerCase().includes(skill.toLowerCase()));
  const techScore = required.length ? Math.round((matches.length / required.length) * 100) : 70;
  const compensationScore = input.extraction.salaryListed ? 90 : 35;
  const fitScore = Math.round((techScore * 0.65) + (compensationScore * 0.15) + 15);

  return {
    fitScore: clamp(fitScore),
    opportunityScore: clamp(Math.round((fitScore + compensationScore) / 2)),
    roleFitScore: clamp(fitScore),
    techStackFitScore: clamp(techScore),
    compensationClarityScore: compensationScore,
    strongestMatches: matches.length ? matches : ["Frontend product work", "Web application experience"],
    possibleGaps: ["Confirm backend ownership expectations", "Ask about testing expectations"],
    redFlags: input.extraction.redFlags,
    resumeAngle: "Lead with dashboard UI, API integration, AI automation, and React/Next.js project work.",
    applicationStrategy: input.extraction.salaryListed
      ? "Worth pursuing if the role scope matches your frontend/full-stack target."
      : "Worth pursuing only if the role is otherwise high-fit; ask for the compensation range early.",
    questionsToAsk: [
      "Can you share the salary range for this role?",
      "What does the frontend/backend split look like?",
      "What would success look like in the first 90 days?",
    ],
    concerns: input.extraction.redFlags,
  };
}

function keywordList(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
