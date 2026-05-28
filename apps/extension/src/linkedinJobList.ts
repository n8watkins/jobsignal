import type { LinkedInJobCard } from "./candidateJobTypes";

const LINKEDIN_JOB_URL_PATTERN = /\/jobs\/view\/(\d+)/;

export function extractLinkedInSidebarJobs(): LinkedInJobCard[] {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/jobs/view/"], a[href*="currentJobId="]'));
  const cardSet = new Set<HTMLElement>();

  for (const anchor of anchors) {
    const card = findCardParent(anchor);
    if (card) cardSet.add(card);
  }

  return dedupeJobs(Array.from(cardSet).map(extractJobCard).filter(Boolean) as LinkedInJobCard[]);
}

function findCardParent(anchor: HTMLElement): HTMLElement | null {
  const candidates = [
    anchor.closest("li"),
    anchor.closest("[data-job-id]"),
    anchor.closest(".job-card-container"),
    anchor.closest(".jobs-search-results__list-item"),
    anchor.closest(".scaffold-layout__list-item"),
  ];
  return candidates.find((candidate): candidate is HTMLElement => candidate instanceof HTMLElement && candidate.innerText?.trim().length > 20) || null;
}

function extractJobCard(card: HTMLElement): LinkedInJobCard | null {
  const rawCardText = cleanText(card.innerText);
  if (!rawCardText || rawCardText.length < 15) return null;

  const anchor = card.querySelector<HTMLAnchorElement>('a[href*="/jobs/view/"], a[href*="currentJobId="]');
  const href = anchor?.href;
  const sourceJobId = extractLinkedInJobId(href || card.getAttribute("data-job-id") || "");
  const lines = rawCardText.split("\n").map(cleanText).filter(Boolean).filter((line) => !isNoiseLine(line));
  const roleTitle = lines[0];
  const companyName = lines[1];
  const location = lines.find((line) => /\b(remote|hybrid|on-site|onsite|united states|los angeles|california|ca|new york|ny)\b/i.test(line));
  const salaryText = rawCardText.match(/\$\s?\d{2,3}(?:,\d{3})?(?:k|K)?\s?(?:-|–|to)\s?\$?\s?\d{2,3}(?:,\d{3})?(?:k|K)?/)?.[0] || null;

  if (!roleTitle && !companyName && !sourceJobId) return null;

  return {
    elementKey: sourceJobId || href || rawCardText.slice(0, 80),
    source: "linkedin",
    sourceJobId,
    jobUrl: href ? normalizeLinkedInJobUrl(href, sourceJobId) : undefined,
    companyName,
    roleTitle,
    location,
    salaryText,
    easyApply: /easy apply/i.test(rawCardText),
    promoted: /promoted/i.test(rawCardText),
    rawCardText,
  };
}

function extractLinkedInJobId(value: string) {
  const directMatch = value.match(LINKEDIN_JOB_URL_PATTERN);
  if (directMatch?.[1]) return directMatch[1];
  try {
    const url = new URL(value);
    return url.searchParams.get("currentJobId") || undefined;
  } catch {
    return value.match(/currentJobId=(\d+)/)?.[1];
  }
}

function normalizeLinkedInJobUrl(href: string, sourceJobId?: string) {
  return sourceJobId ? `https://www.linkedin.com/jobs/view/${sourceJobId}` : href.split("?")[0];
}

function isNoiseLine(line: string) {
  return ["promoted", "easy apply", "actively hiring", "viewed", "be an early applicant", "reposted"].includes(line.toLowerCase());
}

function dedupeJobs(jobs: LinkedInJobCard[]) {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = job.sourceJobId || job.jobUrl || `${job.companyName}-${job.roleTitle}-${job.location}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}
