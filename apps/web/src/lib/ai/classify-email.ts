import type { EmailClassificationResult } from "@jobsignal/shared";

export async function classifyRecruitingEmail(input: {
  sender: string;
  subject: string;
  snippet: string;
  bodyExcerpt?: string;
}): Promise<EmailClassificationResult> {
  const text = `${input.sender} ${input.subject} ${input.snippet} ${input.bodyExcerpt || ""}`.toLowerCase();

  if (/unfortunately|not be moving forward|other candidates/.test(text)) {
    return {
      classification: "rejection",
      applicationStatus: "rejected",
      confidence: 0.92,
      reason: "The message contains common rejection language.",
      actionNeeded: true,
      suggestedNextAction: "Confirm rejection and archive the Gmail thread if handled.",
    };
  }

  if (/availability|schedule|interview|call with/.test(text)) {
    return {
      classification: "interview_request",
      applicationStatus: "interview_requested",
      confidence: 0.88,
      reason: "The message appears to ask for scheduling or interview availability.",
      actionNeeded: true,
      suggestedNextAction: "Reply with availability.",
    };
  }

  if (/assessment|take-home|coding challenge|hacker|test/.test(text)) {
    return {
      classification: "assessment_request",
      applicationStatus: "assessment_requested",
      confidence: 0.86,
      reason: "The message references an assessment or coding challenge.",
      actionNeeded: true,
      suggestedNextAction: "Review and complete the assessment by the deadline.",
    };
  }

  if (/thank you for applying|received your application/.test(text)) {
    return {
      classification: "application_confirmation",
      applicationStatus: "application_confirmed",
      confidence: 0.84,
      reason: "The message confirms that the application was received.",
      actionNeeded: false,
      suggestedNextAction: null,
    };
  }

  if (/recommended jobs|jobs you may like|new jobs for you|job alert/.test(text)) {
    return {
      classification: "job_alert_noise",
      confidence: 0.8,
      reason: "The message looks like a job board recommendation or alert rather than application progress.",
      actionNeeded: false,
      suggestedNextAction: null,
    };
  }

  return {
    classification: "manual_review",
    confidence: 0.55,
    reason: "The message may be job-related, but the pipeline stage is unclear.",
    actionNeeded: true,
    suggestedNextAction: "Review and correct classification.",
  };
}
