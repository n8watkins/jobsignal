import { DEFAULT_JOB_SEARCH_PROFILE } from "@/lib/profile/default-profile";
import type { JobSearchProfileValues } from "@/lib/profile/profile-utils";

export type CandidateJobInput = {
  source?: string;
  sourceJobId?: string;
  jobUrl?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  salaryText?: string | null;
  rawCardText?: string;
  rawDescription?: string;
};

export type CandidateJobScore = {
  fitScore: number;
  scoreLabel: "Strong" | "Good" | "Maybe" | "Skip";
  scoreReasons: string[];
  riskFlags: string[];
  workArrangement: "remote" | "hybrid" | "onsite" | "unknown";
  employmentType: "full_time" | "contract" | "part_time" | "internship" | "unknown";
  salaryListed: boolean;
  detectedTechnologies: string[];
  emphasisAreas: string[];
};

// ─── Tech alias dictionary ────────────────────────────────────────────────────
// The profile stores canonical tech names ("Next.js"); job text uses many
// spellings. This maps a canonical name to the substrings worth searching for.
// Techs absent from the dictionary fall back to their own lowercased name.

const TECH_ALIASES: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs", "app router", "server components"],
  TypeScript: ["typescript", "type-safe", "type safe"],
  JavaScript: ["javascript"],
  Tailwind: ["tailwind", "tailwind css"],
  Firebase: ["firebase", "firestore"],
  GraphQL: ["graphql"],
  Apollo: ["apollo", "apollo client"],
  Zustand: ["zustand"],
  Redux: ["redux", "redux toolkit"],
  Vitest: ["vitest"],
  Jest: ["jest"],
  "Testing Library": ["testing library", "react testing library"],
  "Node.js": ["node.js", "nodejs"],
  pnpm: ["pnpm"],
  Turbo: ["turbo", "turborepo"],
  Radix: ["radix", "radix ui"],
  "Web Vitals": ["web vitals", "core web vitals"],
  Prisma: ["prisma"],
  PostgreSQL: ["postgresql", "postgres"],
  "GraphQL Code Generator": ["graphql code generator", "graphql-codegen", "codegen"],
  AWS: ["aws", "amazon web services"],
  Vercel: ["vercel"],
  Cloudflare: ["cloudflare", "cloudflare workers"],
  "pnpm workspaces": ["pnpm workspaces", "pnpm workspace"],
};

// Generic role/JD words that get trimmed off the edges of a phrase so it
// matches on the distinctive part ("Frontend Engineer" -> "frontend").
const ROLE_STOPWORDS = new Set([
  "engineer", "developer", "dev", "senior", "junior", "sr", "jr", "staff",
  "lead", "principal", "mid", "level", "i", "ii", "iii", "the", "a", "of",
  "and", "or", "to", "only", "required", "based", "experience", "role", "position",
]);

type ScoringTerms = {
  targetTerms: string[];
  cautionTerms: string[];
  strongTech: { label: string; aliases: string[] }[];
  detectTech: { label: string; aliases: string[] }[];
};

const termsCache = new WeakMap<JobSearchProfileValues, ScoringTerms>();

function aliasesFor(tech: string): string[] {
  const match = Object.keys(TECH_ALIASES).find((key) => key.toLowerCase() === tech.toLowerCase());
  const extra = match ? TECH_ALIASES[match] : [];
  return unique([tech.toLowerCase(), ...extra.map((a) => a.toLowerCase())]);
}

// Yields the full phrase plus a "core" with generic role-nouns trimmed off the
// ends, kept as one contiguous phrase so "Frontend Engineer" -> "frontend" and
// "Full Stack Engineer" -> "full stack" (never a bare "full" that hits
// "full-time"). The core is dropped if too short to be distinctive.
function expandPhrases(phrases: string[]): string[] {
  const out: string[] = [];
  for (const phrase of phrases) {
    const lower = phrase.toLowerCase().trim();
    if (!lower) continue;
    out.push(lower);

    const words = lower.split(/[\s/]+/);
    let start = 0;
    let end = words.length;
    while (start < end && ROLE_STOPWORDS.has(words[start])) start++;
    while (end > start && ROLE_STOPWORDS.has(words[end - 1])) end--;
    const core = words.slice(start, end).join(" ");
    if (core && core !== lower && core.length >= 3) out.push(core);
  }
  return unique(out);
}

export function buildScoringTerms(profile: JobSearchProfileValues = DEFAULT_JOB_SEARCH_PROFILE): ScoringTerms {
  const cached = termsCache.get(profile);
  if (cached) return cached;

  const techNames = unique([
    ...profile.strongTechnologies,
    ...profile.secondaryTechnologies,
    ...profile.learningTechnologies,
  ]);

  const terms: ScoringTerms = {
    targetTerms: unique([
      ...expandPhrases(profile.targetRoles),
      ...profile.strongTechnologies.map((t) => t.toLowerCase()),
    ]),
    cautionTerms: expandPhrases(profile.avoidTerms),
    strongTech: profile.strongTechnologies.map((label) => ({ label, aliases: aliasesFor(label) })),
    detectTech: techNames.map((label) => ({ label, aliases: aliasesFor(label) })),
  };

  termsCache.set(profile, terms);
  return terms;
}

// ─── Scoring ───────────────────────────────────────────────────────────────────

export function scoreCandidateJob(
  input: CandidateJobInput,
  profile: JobSearchProfileValues = DEFAULT_JOB_SEARCH_PROFILE,
): CandidateJobScore {
  const terms = buildScoringTerms(profile);
  const text = normalize([input.roleTitle, input.companyName, input.location, input.salaryText || "", input.rawCardText, input.rawDescription].filter(Boolean).join(" "));
  let score = 50;
  const scoreReasons: string[] = [];
  const riskFlags: string[] = [];

  if (terms.targetTerms.some((term) => text.includes(term))) {
    score += 20;
    scoreReasons.push("Target role/title match");
  } else {
    score -= 18;
    riskFlags.push("Weak title match");
  }

  const workArrangement = detectWorkArrangement(text);
  const wa = scoreWorkArrangement(workArrangement, profile.preferredWorkArrangement);
  score += wa.delta;
  if (wa.reason) scoreReasons.push(wa.reason);
  if (wa.flag) riskFlags.push(wa.flag);

  const salaryListed = Boolean(input.salaryText) || /\$\s?\d{2,3}(?:,\d{3}|k)?/i.test(text);
  if (!salaryListed) {
    score -= 8;
    riskFlags.push("No visible pay");
  } else {
    const maxPay = extractMaxSalary(input.salaryText, text);
    const floor = profile.salaryFloor;
    if (floor && maxPay !== null && maxPay < floor) {
      score -= 10;
      riskFlags.push(`Below salary floor ($${floor.toLocaleString()})`);
    } else if (floor && maxPay !== null) {
      score += 10;
      scoreReasons.push("Pay meets floor");
    } else {
      score += 10;
      scoreReasons.push("Pay listed");
    }
  }

  if (text.includes("easy apply")) {
    score += 5;
    scoreReasons.push("Easy Apply");
  }

  const employmentType = detectEmploymentType(text);
  const preferredEmployment = profile.preferredEmploymentType;
  if (employmentType === "full_time") {
    score += 5;
    scoreReasons.push("Full-time");
  } else if (employmentType === "contract") {
    score -= 8;
    riskFlags.push("Contract role");
  } else if (employmentType === "part_time") {
    score -= 10;
    riskFlags.push("Part-time role");
  }
  // Extra nudge when the role conflicts with a strict employment preference.
  if (preferredEmployment === "full_time" && (employmentType === "contract" || employmentType === "part_time")) {
    score -= 4;
  }

  const detectedTechnologies = detectTechnologies(text, terms.detectTech);
  const strongLabels = new Set(terms.strongTech.map((t) => t.label));
  const strongHits = detectedTechnologies.filter((tech) => strongLabels.has(tech));
  if (strongHits.length >= 2) {
    score += 10;
    scoreReasons.push(`Strong tech overlap: ${strongHits.slice(0, 3).join(", ")}`);
  } else if (strongHits.length === 1) {
    score += 4;
    scoreReasons.push(`Some tech overlap: ${strongHits[0]}`);
  }

  // Drop a matched caution term when a longer matched term already contains it
  // (e.g. "php wordpress" inside "php wordpress only") so one avoid phrase that
  // expands to a full form plus a core only penalizes once.
  const matchedCautions = terms.cautionTerms.filter((term) => text.includes(term));
  const maximalCautions = matchedCautions.filter(
    (term) => !matchedCautions.some((other) => other !== term && other.includes(term)),
  );
  for (const term of maximalCautions) {
    score -= 10;
    riskFlags.push(`Potential mismatch: ${term}`);
  }

  const emphasisAreas = detectEmphasisAreas(text);
  score = Math.max(0, Math.min(100, score));

  return { fitScore: score, scoreLabel: labelForScore(score), scoreReasons, riskFlags, workArrangement, employmentType, salaryListed, detectedTechnologies, emphasisAreas };
}

function labelForScore(score: number): CandidateJobScore["scoreLabel"] {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 40) return "Maybe";
  return "Skip";
}

function detectWorkArrangement(text: string): CandidateJobScore["workArrangement"] {
  if (text.includes("remote")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  if (text.includes("onsite") || text.includes("on-site")) return "onsite";
  return "unknown";
}

// Scores the detected arrangement against the user's stated preference, so an
// "Onsite OK" candidate isn't penalized for on-site roles and a "remote only"
// candidate is steered away from hybrid/on-site.
function scoreWorkArrangement(
  arrangement: CandidateJobScore["workArrangement"],
  preference: string,
): { delta: number; reason?: string; flag?: string } {
  switch (arrangement) {
    case "remote":
      return { delta: 15, reason: "Remote role" };
    case "hybrid":
      if (preference === "remote_only") return { delta: -5, flag: "Hybrid (you prefer remote-only)" };
      return { delta: 4, reason: "Hybrid role" };
    case "onsite":
      if (preference === "onsite_ok") return { delta: 0, reason: "On-site (acceptable)" };
      if (preference === "remote_only") return { delta: -20, flag: "On-site (you prefer remote-only)" };
      return { delta: -15, flag: "On-site role" };
    default:
      return { delta: 0 };
  }
}

// Largest annual figure we can read from the pay text, normalized to dollars.
// Only counts comma-grouped ($120,000) or k-suffixed (120k) numbers so stray
// small dollar amounts aren't mistaken for salaries. Returns null if none.
function extractMaxSalary(salaryText: string | null | undefined, text: string): number | null {
  const source = `${salaryText || ""} ${text}`;
  const figures: number[] = [];
  for (const m of source.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+)/g)) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (!Number.isNaN(n)) figures.push(n);
  }
  for (const m of source.matchAll(/(\d{2,3})\s*[kK]\b/g)) {
    const n = parseInt(m[1], 10) * 1000;
    if (!Number.isNaN(n)) figures.push(n);
  }
  return figures.length ? Math.max(...figures) : null;
}

function detectEmploymentType(text: string): CandidateJobScore["employmentType"] {
  if (text.includes("full time") || text.includes("full-time")) return "full_time";
  if (text.includes("part time") || text.includes("part-time")) return "part_time";
  if (text.includes("contract") || text.includes("1099") || text.includes("c2c")) return "contract";
  if (text.includes("internship") || text.includes("intern ")) return "internship";
  return "unknown";
}

function detectTechnologies(text: string, detectTech: { label: string; aliases: string[] }[]) {
  return detectTech.filter(({ aliases }) => aliases.some((alias) => text.includes(alias))).map(({ label }) => label);
}

function detectEmphasisAreas(text: string) {
  const areas: string[] = [];
  if (text.includes("performance") || text.includes("web vitals") || text.includes("optimization")) areas.push("performance");
  if (text.includes("testing") || text.includes("unit test") || text.includes("integration test")) areas.push("testing");
  if (text.includes("architecture") || text.includes("architectural")) areas.push("architecture");
  if (text.includes("mentor") || text.includes("junior engineer")) areas.push("mentorship");
  if (text.includes("graphql") || text.includes("apollo")) areas.push("data fetching");
  if (text.includes("state management") || text.includes("zustand") || text.includes("redux")) areas.push("state management");
  return [...new Set(areas)];
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
