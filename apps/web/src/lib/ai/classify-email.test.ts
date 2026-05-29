import { describe, it, expect } from "vitest";
import { classifyRecruitingEmail } from "./classify-email";

const base = { sender: "careers@example.com", subject: "Update", snippet: "" };

describe("classifyRecruitingEmail", () => {
  it("detects a rejection", async () => {
    const r = await classifyRecruitingEmail({ ...base, snippet: "Unfortunately, we are moving forward with other candidates." });
    expect(r.classification).toBe("rejection");
    expect(r.applicationStatus).toBe("rejected");
  });

  it("detects an interview request", async () => {
    const r = await classifyRecruitingEmail({ ...base, snippet: "Can you share your availability for a call with the team?" });
    expect(r.classification).toBe("interview_request");
    expect(r.applicationStatus).toBe("interview_requested");
  });

  it("detects an assessment request", async () => {
    const r = await classifyRecruitingEmail({ ...base, snippet: "Please complete this take-home coding challenge." });
    expect(r.classification).toBe("assessment_request");
  });

  it("detects an application confirmation", async () => {
    const r = await classifyRecruitingEmail({ ...base, snippet: "Thank you for applying to our team." });
    expect(r.classification).toBe("application_confirmation");
    expect(r.actionNeeded).toBe(false);
  });

  it("treats job-board alerts as noise", async () => {
    const r = await classifyRecruitingEmail({ ...base, subject: "New jobs for you", snippet: "Recommended jobs you may like." });
    expect(r.classification).toBe("job_alert_noise");
  });

  it("falls back to manual review for ambiguous mail with low confidence", async () => {
    const r = await classifyRecruitingEmail({ ...base, snippet: "Following up on our chat." });
    expect(r.classification).toBe("manual_review");
    expect(r.confidence).toBeLessThan(0.7);
  });
});
