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

const TARGET_TERMS = ["frontend", "front end", "react", "next.js", "nextjs", "web engineer", "full stack", "full-stack", "typescript", "product engineer"];
const CAUTION_TERMS = ["angular", "wordpress", "php", "onsite", "on-site", "clearance", "senior backend", "staffing"];

const TECH: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs", "app router", "server components"],
  TypeScript: ["typescript", "type-safe", "type safe"],
  JavaScript: ["javascript"],
  Tailwind: ["tailwind", "tailwind css"],
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
};

export function scoreCandidateJob(input: CandidateJobInput): CandidateJobScore {
  const text = normalize([input.roleTitle, input.companyName, input.location, input.salaryText || "", input.rawCardText, input.rawDescription].filter(Boolean).join(" "));
  let score = 50;
  const scoreReasons: string[] = [];
  const riskFlags: string[] = [];

  if (TARGET_TERMS.some((term) => text.includes(term))) {
    score += 20;
    scoreReasons.push("Target role/title match");
  } else {
    score -= 18;
    riskFlags.push("Weak title match");
  }

  const workArrangement = detectWorkArrangement(text);
  if (workArrangement === "remote") {
    score += 15;
    scoreReasons.push("Remote role");
  } else if (workArrangement === "hybrid") {
    score += 4;
    scoreReasons.push("Hybrid role");
  } else if (workArrangement === "onsite") {
    score -= 15;
    riskFlags.push("On-site role");
  }

  const salaryListed = Boolean(input.salaryText) || /\$\s?\d{2,3}(?:,\d{3}|k)?/i.test(text);
  if (salaryListed) {
    score += 10;
    scoreReasons.push("Pay listed");
  } else {
    score -= 8;
    riskFlags.push("No visible pay");
  }

  if (text.includes("easy apply")) {
    score += 5;
    scoreReasons.push("Easy Apply");
  }

  const employmentType = detectEmploymentType(text);
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

  const detectedTechnologies = extractTechnologies(text);
  const strongHits = detectedTechnologies.filter((tech) => ["React", "Next.js", "TypeScript", "Tailwind", "Node.js"].includes(tech));
  if (strongHits.length >= 2) {
    score += 10;
    scoreReasons.push(`Strong tech overlap: ${strongHits.slice(0, 3).join(", ")}`);
  } else if (strongHits.length === 1) {
    score += 4;
    scoreReasons.push(`Some tech overlap: ${strongHits[0]}`);
  }

  for (const term of CAUTION_TERMS) {
    if (text.includes(term)) {
      score -= 10;
      riskFlags.push(`Potential mismatch: ${term}`);
    }
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

function detectEmploymentType(text: string): CandidateJobScore["employmentType"] {
  if (text.includes("full time") || text.includes("full-time")) return "full_time";
  if (text.includes("part time") || text.includes("part-time")) return "part_time";
  if (text.includes("contract") || text.includes("1099") || text.includes("c2c")) return "contract";
  if (text.includes("internship") || text.includes("intern ")) return "internship";
  return "unknown";
}

function extractTechnologies(text: string) {
  return Object.entries(TECH).filter(([, aliases]) => aliases.some((alias) => text.includes(alias))).map(([label]) => label);
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
