export type LinkedInJobCard = {
  elementKey: string;
  source: "linkedin";
  sourceJobId?: string;
  jobUrl?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  salaryText?: string | null;
  easyApply?: boolean;
  promoted?: boolean;
  rawCardText: string;
};

export type CandidateJobScore = {
  fitScore: number;
  scoreLabel: "Strong" | "Good" | "Maybe" | "Skip";
  scoreReasons: string[];
  riskFlags: string[];
  workArrangement: "remote" | "hybrid" | "onsite" | "unknown";
  employmentType: "full_time" | "contract" | "part_time" | "internship" | "unknown";
  salaryListed: boolean;
};

export type ScoredLinkedInJobCard = LinkedInJobCard & CandidateJobScore;
