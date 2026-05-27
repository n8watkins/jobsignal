export const APPLICATION_STATUSES = [
  "draft",
  "applied",
  "application_confirmed",
  "recruiter_responded",
  "interview_requested",
  "assessment_requested",
  "interviewing",
  "offer_final_stage",
  "rejected",
  "archived",
  "not_pursuing",
] as const;

export const EMAIL_CLASSIFICATIONS = [
  "application_confirmation",
  "rejection",
  "interview_request",
  "assessment_request",
  "recruiter_reply",
  "offer_final_stage",
  "job_board_recommendation",
  "job_alert_noise",
  "manual_review",
  "not_job_related",
] as const;

export const SOURCES = [
  "linkedin",
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "indeed",
  "company_site",
  "generic",
  "manual",
] as const;
