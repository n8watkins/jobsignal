import { describe, it, expect } from "vitest";
import { extractJobDescription, analyzeJobFit } from "./analyze-job";

describe("extractJobDescription", () => {
  it("extracts a salary range and marks salary listed", async () => {
    const r = await extractJobDescription({ rawDescription: "Compensation: $120,000 - $150,000 per year." });
    expect(r.salaryListed).toBe(true);
    expect(r.salaryText).toMatch(/120,000/);
  });

  it("flags a missing salary as a red flag", async () => {
    const r = await extractJobDescription({ rawDescription: "Great team, no comp info here." });
    expect(r.salaryListed).toBe(false);
    expect(r.redFlags).toContain("No salary listed");
  });

  it("classifies workplace type", async () => {
    expect((await extractJobDescription({ rawDescription: "This is a fully remote position." })).workplaceType).toBe("remote");
    expect((await extractJobDescription({ rawDescription: "Hybrid, 3 days in office." })).workplaceType).toBe("hybrid");
    expect((await extractJobDescription({ rawDescription: "Strictly on-site in NYC." })).workplaceType).toBe("onsite");
  });

  it("classifies employment type and seniority", async () => {
    const r = await extractJobDescription({ rawDescription: "Senior Software Engineer, full-time permanent role." });
    expect(r.employmentType).toBe("full_time");
    expect(r.seniorityLevel).toBe("Senior");
  });

  it("separates required from nice-to-have tech by section", async () => {
    const jd = [
      "Requirements:",
      "- Strong React and TypeScript experience",
      "Nice to have:",
      "- GraphQL exposure",
    ].join("\n");
    const r = await extractJobDescription({ rawDescription: jd });
    expect(r.requiredSkills).toContain("React");
    expect(r.requiredSkills).toContain("TypeScript");
    expect(r.niceToHaveSkills).toContain("GraphQL");
    expect(r.requiredSkills).not.toContain("GraphQL");
  });

  it("raises confidence as more fields resolve and clamps at 0.95", async () => {
    const sparse = await extractJobDescription({ rawDescription: "We are hiring." });
    const rich = await extractJobDescription({
      companyName: "Acme",
      roleTitle: "Senior Frontend Engineer",
      location: "Remote",
      rawDescription: "Senior Frontend Engineer at Acme. Remote. $150,000-$190,000. React, Next.js, TypeScript, Node.js, GraphQL, Prisma, AWS, Docker.",
    });
    expect(rich.confidence).toBeGreaterThan(sparse.confidence);
    expect(rich.confidence).toBeLessThanOrEqual(0.95);
  });

  it("flags ninja/rockstar job-ad language", async () => {
    const r = await extractJobDescription({ rawDescription: "Looking for a coding ninja rockstar. $100k." });
    expect(r.redFlags).toContain("Rockstar/ninja job ad language");
  });
});

describe("analyzeJobFit", () => {
  it("scores higher when the resume covers the required skills", async () => {
    const extraction = await extractJobDescription({ rawDescription: "Requirements:\n- React\n- TypeScript\n$150k" });
    const strong = await analyzeJobFit({ resumeText: "Expert in React and TypeScript", extraction });
    const weak = await analyzeJobFit({ resumeText: "Mostly COBOL and Fortran", extraction });
    expect(strong.techStackFitScore).toBeGreaterThan(weak.techStackFitScore);
    expect(strong.fitScore).toBeGreaterThanOrEqual(0);
    expect(strong.fitScore).toBeLessThanOrEqual(100);
  });

  it("advises caution when no salary is listed", async () => {
    const extraction = await extractJobDescription({ rawDescription: "Requirements:\n- React" });
    const analysis = await analyzeJobFit({ extraction });
    expect(analysis.compensationClarityScore).toBeLessThan(50);
    expect(analysis.applicationStrategy.toLowerCase()).toContain("cautiously");
  });
});
