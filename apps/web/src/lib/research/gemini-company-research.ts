import { GoogleGenAI } from "@google/genai";
import type { CompanyResearchProfile } from "./company-profile-schema";
import { parseJsonObjectFromModelText, safeNumber, safeString, safeStringArray } from "./json";
import { researchConfig } from "./research-config";

type ResearchTaskLike = {
  id: string;
  companyName: string;
  taskType: string;
  prompt?: string | null;
  applicationId?: string | null;
  candidateJobId?: string | null;
};

type ResearchContext = {
  roleTitle?: string | null;
  jobDescription?: string | null;
  jobUrl?: string | null;
  fitScore?: number | null;
};

export async function runGeminiCompanyResearch(input: {
  task: ResearchTaskLike;
  context?: ResearchContext;
}): Promise<{
  profile: CompanyResearchProfile;
  rawText: string;
  webSearchQueries: string[];
  groundingSources: Array<{ title: string; uri: string }>;
}> {
  if (!researchConfig.searchEnabled) {
    throw new Error("AI_SEARCH_ENABLED is false. Turn it on only when you are ready to spend search budget.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in apps/web/.env.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: researchConfig.researchModel,
    contents: buildPrompt(input.task, input.context),
    config: { tools: [{ googleSearch: {} }] },
  });

  const rawText = response.text || "";
  const parsed = parseJsonObjectFromModelText(rawText);
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata as any;
  const webSearchQueries = Array.isArray(groundingMetadata?.webSearchQueries)
    ? groundingMetadata.webSearchQueries.filter(Boolean).map(String)
    : [];
  const groundingSources = Array.isArray(groundingMetadata?.groundingChunks)
    ? groundingMetadata.groundingChunks
        .map((chunk: any) => ({ title: String(chunk?.web?.title || "Untitled source"), uri: String(chunk?.web?.uri || "") }))
        .filter((source: any) => source.uri)
    : [];

  return {
    profile: normalizeProfile(parsed, input.task.companyName, groundingSources),
    rawText,
    webSearchQueries,
    groundingSources,
  };
}

function buildPrompt(task: ResearchTaskLike, context?: ResearchContext) {
  return `
You are researching a company for a personal job application tracker.

Company: ${task.companyName}
Research task: ${task.taskType}
Relevant role: ${context?.roleTitle || "unknown"}
Job URL: ${context?.jobUrl || "unknown"}
Fit score: ${context?.fitScore ?? "unknown"}

Use Google Search grounding. Prioritize official or high-quality sources:
1. official company website
2. official careers page
3. official engineering/product blog
4. official press release or investor page
5. reputable news/funding source
6. LinkedIn company page
7. job boards only if better sources are unavailable

Baseline research should answer:
- what the company does
- product category
- customer segment
- company size/stage
- hiring signal
- recent signals
- engineering/product clues if discoverable
- risk flags
- what facts are missing or low-confidence
- follow-up research tasks worth queueing

Return ONLY valid JSON. No markdown. No prose outside JSON.

JSON shape:
{
  "companyName": "string",
  "officialWebsite": "string or null",
  "summary": "string or null",
  "productCategory": "string or null",
  "customerSegment": "string or null",
  "companySize": "string or null",
  "companyStage": "string or null",
  "hiringSignalScore": 0,
  "riskScore": 0,
  "sourceQualityScore": 0,
  "riskFlags": ["string"],
  "keySources": [{ "title": "string", "uri": "string", "sourceType": "official|careers|engineering_blog|press|news|linkedin|job_board|aggregator|forum|unknown", "usefulness": 0 }],
  "missingFields": ["string"],
  "recommendedFollowups": [{ "taskType": "company_size_stage_check|hiring_signal_check|engineering_stack_check|recent_news_check|source_quality_check|company_identity_product_check", "reason": "string", "priority": 0, "searchCostEstimate": 1 }]
}

Job description/context, if available:
${truncate(context?.jobDescription || "", 5000)}
`.trim();
}

function normalizeProfile(parsed: any, fallbackCompanyName: string, groundingSources: Array<{ title: string; uri: string }>): CompanyResearchProfile {
  const modelSources = Array.isArray(parsed.keySources)
    ? parsed.keySources
        .map((source: any) => ({
          title: String(source?.title || "Untitled source"),
          uri: String(source?.uri || ""),
          sourceType: String(source?.sourceType || "unknown"),
          usefulness: safeNumber(source?.usefulness) ?? 50,
        }))
        .filter((source: any) => source.uri)
    : [];

  const fallbackSources = groundingSources.map((source) => ({
    title: source.title,
    uri: source.uri,
    sourceType: inferSourceType(source.title, source.uri),
    usefulness: 50,
  }));

  const keySources = dedupeSources([...modelSources, ...fallbackSources]);

  return {
    companyName: safeString(parsed.companyName) || fallbackCompanyName,
    officialWebsite: safeString(parsed.officialWebsite),
    summary: safeString(parsed.summary),
    productCategory: safeString(parsed.productCategory),
    customerSegment: safeString(parsed.customerSegment),
    companySize: safeString(parsed.companySize),
    companyStage: safeString(parsed.companyStage),
    hiringSignalScore: safeNumber(parsed.hiringSignalScore),
    riskScore: safeNumber(parsed.riskScore),
    sourceQualityScore: safeNumber(parsed.sourceQualityScore) ?? inferSourceQuality(keySources),
    riskFlags: safeStringArray(parsed.riskFlags),
    keySources,
    missingFields: safeStringArray(parsed.missingFields),
    recommendedFollowups: normalizeFollowups(parsed.recommendedFollowups),
  };
}

function normalizeFollowups(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      taskType: String(item?.taskType || "").trim(),
      reason: String(item?.reason || "").trim(),
      priority: safeNumber(item?.priority) ?? 50,
      searchCostEstimate: safeNumber(item?.searchCostEstimate) ?? 1,
    }))
    .filter((item) => item.taskType && item.reason)
    .slice(0, 5);
}

function inferSourceQuality(sources: Array<{ sourceType: string; usefulness: number }>) {
  if (sources.length === 0) return 20;
  const authorityBoost = sources.some((source) => ["official", "careers", "engineering_blog", "press"].includes(source.sourceType)) ? 20 : 0;
  const average = Math.round(sources.reduce((sum, source) => sum + source.usefulness, 0) / sources.length);
  return Math.max(0, Math.min(100, average + authorityBoost));
}

function inferSourceType(title: string, uri: string) {
  const value = `${title} ${uri}`.toLowerCase();
  if (value.includes("careers")) return "careers";
  if (value.includes("engineering") || value.includes("developer")) return "engineering_blog";
  if (value.includes("press") || value.includes("newsroom")) return "press";
  if (value.includes("linkedin.com")) return "linkedin";
  if (value.includes("greenhouse") || value.includes("lever.co") || value.includes("ashby")) return "job_board";
  return "unknown";
}

function dedupeSources(sources: Array<{ title: string; uri: string; sourceType: string; usefulness: number }>) {
  const seen = new Set<string>();
  const deduped = [];
  for (const source of sources) {
    if (!source.uri || seen.has(source.uri)) continue;
    seen.add(source.uri);
    deduped.push(source);
  }
  return deduped.slice(0, 10);
}

function truncate(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars) + "\n...[truncated]";
}
