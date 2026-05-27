import type { CapturedJob } from "../types";

export function extractGenericJob(): CapturedJob {
  const title = document.querySelector("h1")?.textContent?.trim();
  const pageText = Array.from(document.querySelectorAll("main, article, body"))
    .map((node) => node.textContent || "")
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);

  return {
    source: "generic",
    jobUrl: location.href,
    roleTitle: title || document.title,
    workplaceType: /remote/i.test(pageText) ? "remote" : /hybrid/i.test(pageText) ? "hybrid" : "unknown",
    salaryListed: /\$\s?\d{2,3}/.test(pageText),
    salaryText: pageText.match(/\$\s?\d{2,3}[,kK]?\s?(?:-|to|–)\s?\$?\s?\d{2,3}[,kK]?/i)?.[0] || null,
    rawDescription: pageText,
    applicationMethod: "manual_or_company_site",
  };
}
