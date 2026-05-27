export type CapturedJob = {
  source: "linkedin" | "greenhouse" | "lever" | "ashby" | "workday" | "generic";
  sourceJobId?: string;
  jobUrl?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  workplaceType?: "remote" | "hybrid" | "onsite" | "unknown";
  employmentType?: "full_time" | "contract" | "part_time" | "internship" | "unknown";
  salaryText?: string | null;
  salaryListed?: boolean;
  rawDescription?: string;
  applicationMethod?: string;
  resumeVersionId?: string;
  notes?: string;
};
