import type { CapturedJob } from "../types";

function text(selector: string) {
  return document.querySelector(selector)?.textContent?.trim().replace(/\s+/g, " ") || undefined;
}

export function extractLinkedInJob(): CapturedJob {
  const url = new URL(location.href);
  const sourceJobId = url.pathname.match(/jobs\/view\/(\d+)/)?.[1] || url.searchParams.get("currentJobId") || undefined;
  const roleTitle =
    text(".job-details-jobs-unified-top-card__job-title") ||
    text("h1") ||
    document.title.replace(/\s*\|\s*LinkedIn.*/i, "");

  const companyName =
    text(".job-details-jobs-unified-top-card__company-name") ||
    text(".jobs-unified-top-card__company-name") ||
    text("a[href*='/company/']");

  const locationText =
    text(".job-details-jobs-unified-top-card__primary-description-container") ||
    text(".jobs-unified-top-card__bullet") ||
    undefined;

  const description =
    text(".jobs-description-content__text") ||
    text("#job-details") ||
    text(".jobs-box__html-content") ||
    document.body.innerText.slice(0, 12000);

  const salaryText = description.match(/\$\s?\d{2,3}[,kK]?\s?(?:-|to|–)\s?\$?\s?\d{2,3}[,kK]?/i)?.[0] || null;

  return {
    source: "linkedin",
    sourceJobId,
    jobUrl: location.href,
    companyName,
    roleTitle,
    location: locationText,
    workplaceType: /remote/i.test(description) ? "remote" : /hybrid/i.test(description) ? "hybrid" : "unknown",
    salaryListed: Boolean(salaryText),
    salaryText,
    rawDescription: description,
    applicationMethod: "linkedin_easy_apply",
  };
}
