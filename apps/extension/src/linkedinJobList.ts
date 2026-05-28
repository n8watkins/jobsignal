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
  const rawMultilineText = normalizeMultilineText(card.innerText);
  const rawCardText = cleanInlineText(card.innerText);
  if (!rawCardText || rawCardText.length < 15) return null;

  const anchor = card.querySelector<HTMLAnchorElement>('a[href*="/jobs/view/"], a[href*="currentJobId="]');
  const href = anchor?.href;
  const sourceJobId = extractLinkedInJobId(href || card.getAttribute("data-job-id") || "");
  const lines = rawMultilineText.split("\n").map(cleanInlineText).filter(Boolean).filter((line) => !isNoiseLine(line));

  const roleTitle = inferRoleTitle(card, lines, anchor);
  const companyName = inferCompanyName(card, lines, roleTitle);
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

function inferRoleTitle(card: HTMLElement, lines: string[], anchor?: HTMLAnchorElement | null) {
  const ariaLabel = cleanInlineText(anchor?.getAttribute("aria-label"));
  if (ariaLabel && !isNoiseLine(ariaLabel)) return ariaLabel.replace(/^view job\s*/i, "").trim();

  const titleElement = card.querySelector<HTMLElement>(
    ".job-card-list__title, .job-card-container__link, .artdeco-entity-lockup__title, strong",
  );
  const titleText = cleanInlineText(titleElement?.innerText || titleElement?.textContent || "");
  if (titleText && !isNoiseLine(titleText)) return titleText;

  return lines[0];
}

function inferCompanyName(card: HTMLElement, lines: string[], roleTitle?: string) {
  const companyElement = card.querySelector<HTMLElement>(
    ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle",
  );
  const companyText = cleanInlineText(companyElement?.innerText || companyElement?.textContent || "");
  if (companyText && companyText !== roleTitle && !isNoiseLine(companyText)) return companyText;

  return lines.find((line) => line !== roleTitle && !looksLikeLocation(line) && !looksLikeMetadata(line));
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

function looksLikeLocation(line: string) {
  return /\b(remote|hybrid|on-site|onsite|united states|los angeles|california|ca|new york|ny)\b/i.test(line);
}

function looksLikeMetadata(line: string) {
  return /\b(applicants?|ago|viewed|promoted|easy apply|reposted)\b/i.test(line);
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

function normalizeMultilineText(value?: string | null) {
  return value?.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim() || "";
}

function cleanInlineText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}
