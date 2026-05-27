import type { CapturedJob } from "../types";

const SALARY_REGEX = /(?:\$\s?\d{2,3}(?:[,\d]{0,6})?\s?(?:k|K)?\s?(?:-|to|–)\s?\$?\s?\d{2,3}(?:[,\d]{0,6})?\s?(?:k|K)?|\$\s?\d{2,3}(?:[,\d]{0,6})?\s?(?:k|K)?\+?)/i;

function clean(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function text(...selectors: string[]) {
  for (const selector of selectors) {
    const value = clean(document.querySelector(selector)?.textContent);
    if (value) return value;
  }
  return undefined;
}

function allText(...selectors: string[]) {
  for (const selector of selectors) {
    const nodes = Array.from(document.querySelectorAll(selector));
    const value = clean(nodes.map((node) => node.textContent || "").join("\n"));
    if (value) return value;
  }
  return undefined;
}

function parseLinkedInJobId(url: URL) {
  return (
    url.pathname.match(/jobs\/view\/(\d+)/)?.[1] ||
    url.searchParams.get("currentJobId") ||
    url.searchParams.get("jobId") ||
    url.searchParams.get("trackingId") ||
    undefined
  );
}

function getDescription() {
  const showMoreButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => /show more|see more/i.test(button.innerText || button.textContent || ""));
  showMoreButton?.click();

  return (
    allText(
      ".jobs-description-content__text",
      ".jobs-description__content",
      ".jobs-box__html-content",
      "#job-details",
      "section.jobs-description"
    ) ||
    clean(document.querySelector("main")?.textContent)?.slice(0, 16000) ||
    clean(document.body.innerText)?.slice(0, 16000)
  );
}

function getLocation() {
  const topCardText = text(
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__bullet"
  );

  if (!topCardText) return undefined;

  const parts = topCardText
    .split("·")
    .map((part) => clean(part))
    .filter(Boolean) as string[];

  return parts.find((part) => !/followers|applicants|connections|employees/i.test(part)) || topCardText;
}

function getWorkplaceType(textBlock: string) {
  if (/\bremote\b/i.test(textBlock)) return "remote";
  if (/\bhybrid\b/i.test(textBlock)) return "hybrid";
  if (/\bon-site\b|\bonsite\b|\bin office\b/i.test(textBlock)) return "onsite";
  return "unknown";
}

function getEmploymentType(textBlock: string) {
  if (/\bcontract\b|\bcontractor\b/i.test(textBlock)) return "contract";
  if (/\bintern\b|\binternship\b/i.test(textBlock)) return "internship";
  if (/\bpart[- ]time\b/i.test(textBlock)) return "part_time";
  if (/\bfull[- ]time\b/i.test(textBlock)) return "full_time";
  return "unknown";
}

export function extractLinkedInJob(): CapturedJob {
  const url = new URL(location.href);
  const sourceJobId = parseLinkedInJobId(url);

  const roleTitle =
    text(
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title",
      "h1.t-24",
      "h1"
    ) || document.title.replace(/\s*\|\s*LinkedIn.*/i, "");

  const companyName =
    text(
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      ".job-details-jobs-unified-top-card__company-name a",
      "a[href*='/company/']"
    );

  const locationText = getLocation();
  const description = getDescription() || "";
  const salaryText = description.match(SALARY_REGEX)?.[0] || null;
  const combinedText = `${roleTitle || ""}\n${companyName || ""}\n${locationText || ""}\n${description}`;

  return {
    source: "linkedin",
    sourceJobId,
    jobUrl: location.href,
    companyName,
    roleTitle,
    location: locationText,
    workplaceType: getWorkplaceType(combinedText),
    employmentType: getEmploymentType(combinedText),
    salaryListed: Boolean(salaryText),
    salaryText,
    rawDescription: description.slice(0, 20000),
    applicationMethod: "linkedin_easy_apply",
  };
}
