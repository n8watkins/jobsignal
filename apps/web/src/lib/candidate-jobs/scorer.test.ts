import { describe, it, expect } from "vitest";
import { scoreCandidateJob, buildScoringTerms } from "./scorer";
import { DEFAULT_JOB_SEARCH_PROFILE } from "@/lib/profile/default-profile";
import type { JobSearchProfileValues } from "@/lib/profile/profile-utils";

function profile(overrides: Partial<JobSearchProfileValues> = {}): JobSearchProfileValues {
  return { ...DEFAULT_JOB_SEARCH_PROFILE, ...overrides };
}

describe("buildScoringTerms", () => {
  it("trims generic role-nouns to a distinctive core, never a bare 'full'", () => {
    const terms = buildScoringTerms(profile({ targetRoles: ["Full Stack Engineer", "Frontend Engineer"] }));
    expect(terms.targetTerms).toContain("frontend");
    expect(terms.targetTerms).toContain("full stack");
    // The bug: exploding "Full Stack Engineer" into a bare "full" that hits "full-time".
    expect(terms.targetTerms).not.toContain("full");
    expect(terms.targetTerms).not.toContain("engineer");
  });

  it("includes strong technologies as target terms", () => {
    const terms = buildScoringTerms(profile({ strongTechnologies: ["React", "Rust"] }));
    expect(terms.targetTerms).toContain("react");
    expect(terms.targetTerms).toContain("rust");
  });
});

describe("scoreCandidateJob — profile drives scoring", () => {
  const rustJob = {
    roleTitle: "Senior Rust Backend Engineer",
    companyName: "Acme",
    location: "Remote",
    salaryText: "$160,000-$200,000",
    rawCardText: "Remote. We build distributed systems in Rust. Full-time. Easy Apply.",
  };

  it("flags a weak title match when the role is off-profile", () => {
    const result = scoreCandidateJob(rustJob, DEFAULT_JOB_SEARCH_PROFILE);
    expect(result.scoreReasons).not.toContain("Target role/title match");
    expect(result.riskFlags).toContain("Weak title match");
  });

  it("scores the same job higher once the profile targets it", () => {
    const frontend = scoreCandidateJob(rustJob, DEFAULT_JOB_SEARCH_PROFILE);
    const rust = scoreCandidateJob(
      rustJob,
      profile({ targetRoles: ["Rust Backend Engineer"], strongTechnologies: ["Rust", "Go"] }),
    );
    expect(rust.fitScore).toBeGreaterThan(frontend.fitScore);
    expect(rust.scoreReasons).toContain("Target role/title match");
    expect(rust.detectedTechnologies).toContain("Rust");
  });
});

describe("scoreCandidateJob — regression guards", () => {
  it("does not treat 'full-time' as a target match for 'Full Stack Engineer'", () => {
    const result = scoreCandidateJob(
      { roleTitle: "Backend Engineer", rawCardText: "Full-time backend role." },
      profile({ targetRoles: ["Full Stack Engineer"], strongTechnologies: [] }),
    );
    expect(result.scoreReasons).not.toContain("Target role/title match");
    expect(result.riskFlags).toContain("Weak title match");
  });

  it("penalizes an avoid phrase only once when full and core forms both match", () => {
    const result = scoreCandidateJob(
      { roleTitle: "WordPress Developer", rawCardText: "PHP WordPress only. Contract." },
      profile({ avoidTerms: ["php wordpress only"] }),
    );
    const mismatches = result.riskFlags.filter((f) => f.startsWith("Potential mismatch"));
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toBe("Potential mismatch: php wordpress only");
  });
});

describe("scoreCandidateJob — signal handling", () => {
  it("rewards remote over onsite for an otherwise identical role", () => {
    const base = { roleTitle: "Frontend Engineer", salaryText: "$150k" };
    const remote = scoreCandidateJob({ ...base, rawCardText: "Remote React role" }, DEFAULT_JOB_SEARCH_PROFILE);
    const onsite = scoreCandidateJob({ ...base, rawCardText: "Onsite React role" }, DEFAULT_JOB_SEARCH_PROFILE);
    expect(remote.fitScore).toBeGreaterThan(onsite.fitScore);
    expect(remote.workArrangement).toBe("remote");
    expect(onsite.workArrangement).toBe("onsite");
  });

  it("detects technologies through alias spellings", () => {
    const result = scoreCandidateJob(
      { roleTitle: "Frontend Engineer", rawCardText: "We use nextjs and react.js daily." },
      DEFAULT_JOB_SEARCH_PROFILE,
    );
    expect(result.detectedTechnologies).toContain("Next.js");
    expect(result.detectedTechnologies).toContain("React");
  });

  it("respects an onsite-ok preference instead of penalizing on-site", () => {
    const job = { roleTitle: "Frontend Engineer", salaryText: "$150k", rawCardText: "Onsite React role in NYC." };
    const strict = scoreCandidateJob(job, profile({ preferredWorkArrangement: "remote_or_hybrid" }));
    const okWithOnsite = scoreCandidateJob(job, profile({ preferredWorkArrangement: "onsite_ok" }));
    expect(strict.riskFlags).toContain("On-site role");
    expect(okWithOnsite.riskFlags).not.toContain("On-site role");
    expect(okWithOnsite.fitScore).toBeGreaterThan(strict.fitScore);
  });

  it("flags hybrid for a remote-only candidate", () => {
    const result = scoreCandidateJob(
      { roleTitle: "Frontend Engineer", salaryText: "$150k", rawCardText: "Hybrid React role." },
      profile({ preferredWorkArrangement: "remote_only" }),
    );
    expect(result.riskFlags.some((f) => f.toLowerCase().includes("hybrid"))).toBe(true);
  });

  it("grades listed pay against the salary floor", () => {
    const job = (salaryText: string) => ({ roleTitle: "Frontend Engineer", salaryText, rawCardText: "Remote React role." });
    const below = scoreCandidateJob(job("$80,000"), profile({ salaryFloor: 100000 }));
    const above = scoreCandidateJob(job("$160,000-$200,000"), profile({ salaryFloor: 100000 }));
    expect(below.riskFlags).toContain("Below salary floor ($100,000)");
    expect(above.scoreReasons).toContain("Pay meets floor");
    expect(above.fitScore).toBeGreaterThan(below.fitScore);
  });

  it("treats pay as merely listed when no floor is set", () => {
    const result = scoreCandidateJob(
      { roleTitle: "Frontend Engineer", salaryText: "$80,000", rawCardText: "Remote React role." },
      profile({ salaryFloor: null as unknown as number }),
    );
    expect(result.scoreReasons).toContain("Pay listed");
    expect(result.riskFlags).not.toContain("Below salary floor ($0)");
  });

  it("flags missing pay and labels a clean frontend role Strong", () => {
    const strong = scoreCandidateJob(
      {
        roleTitle: "Senior Frontend Engineer",
        companyName: "Vercel",
        salaryText: "$170k-$210k",
        rawCardText: "Remote. React, Next.js, TypeScript, Tailwind. Full-time. Easy Apply.",
      },
      DEFAULT_JOB_SEARCH_PROFILE,
    );
    expect(strong.scoreLabel).toBe("Strong");

    const noPay = scoreCandidateJob(
      { roleTitle: "Frontend Engineer", rawCardText: "Remote React role." },
      DEFAULT_JOB_SEARCH_PROFILE,
    );
    expect(noPay.riskFlags).toContain("No visible pay");
  });
});
