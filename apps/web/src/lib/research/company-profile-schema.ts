export type CompanyResearchProfile = {
  companyName: string;
  officialWebsite: string | null;
  summary: string | null;
  productCategory: string | null;
  customerSegment: string | null;
  companySize: string | null;
  companyStage: string | null;
  hiringSignalScore: number | null;
  riskScore: number | null;
  sourceQualityScore: number | null;
  riskFlags: string[];
  keySources: Array<{
    title: string;
    uri: string;
    sourceType: string;
    usefulness: number;
  }>;
  missingFields: string[];
  recommendedFollowups: Array<{
    taskType: string;
    reason: string;
    priority: number;
    searchCostEstimate: number;
  }>;
};
