import { DEFAULT_JOB_SEARCH_PROFILE } from "./default-profile";

export type JobSearchProfileValues = typeof DEFAULT_JOB_SEARCH_PROFILE;

export function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

export function stringifyList(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value.map(String).map((item) => item.trim()).filter(Boolean));
  if (typeof value === "string") return JSON.stringify(value.split(/\n|,/).map((item) => item.trim()).filter(Boolean));
  return "[]";
}

export function profileRecordToValues(record: any): JobSearchProfileValues {
  if (!record) return DEFAULT_JOB_SEARCH_PROFILE;
  return {
    targetRoles: parseJsonList(record.targetRoles),
    strongTechnologies: parseJsonList(record.strongTechnologies),
    secondaryTechnologies: parseJsonList(record.secondaryTechnologies),
    learningTechnologies: parseJsonList(record.learningTechnologies),
    avoidTerms: parseJsonList(record.avoidTerms),
    preferredWorkArrangement: record.preferredWorkArrangement || DEFAULT_JOB_SEARCH_PROFILE.preferredWorkArrangement,
    preferredEmploymentType: record.preferredEmploymentType || DEFAULT_JOB_SEARCH_PROFILE.preferredEmploymentType,
    salaryFloor: record.salaryFloor ?? DEFAULT_JOB_SEARCH_PROFILE.salaryFloor,
    preferredLocation: record.preferredLocation || DEFAULT_JOB_SEARCH_PROFILE.preferredLocation,
    recruiterTolerance: record.recruiterTolerance || DEFAULT_JOB_SEARCH_PROFILE.recruiterTolerance,
  };
}
