import type { LinkedInJobCard, ScoredLinkedInJobCard } from "./candidateJobTypes";

const BADGE_ATTR = "data-jobsignal-badge";

export function attachScoresToLinkedInCards(scoredJobs: ScoredLinkedInJobCard[]) {
  for (const job of scoredJobs) {
    const card = findCardForJob(job);
    if (!card) continue;
    upsertBadge(card, job);
  }
}

function findCardForJob(job: LinkedInJobCard): HTMLElement | null {
  if (job.sourceJobId) {
    const byHref = document.querySelector<HTMLElement>(`a[href*="${job.sourceJobId}"]`);
    const card = byHref ? findCardParent(byHref) : null;
    if (card) return card;
  }

  const cards = Array.from(document.querySelectorAll<HTMLElement>("li, [data-job-id], .job-card-container, .jobs-search-results__list-item"));
  return cards.find((card) => {
    const text = card.innerText || "";
    return Boolean(job.roleTitle && job.companyName && text.includes(job.roleTitle) && text.includes(job.companyName));
  }) || null;
}

function findCardParent(element: HTMLElement): HTMLElement | null {
  const candidates = [
    element.closest("li"),
    element.closest("[data-job-id]"),
    element.closest(".job-card-container"),
    element.closest(".jobs-search-results__list-item"),
    element.closest(".scaffold-layout__list-item"),
  ];
  return candidates.find((candidate): candidate is HTMLElement => candidate instanceof HTMLElement) || null;
}

function upsertBadge(card: HTMLElement, job: ScoredLinkedInJobCard) {
  let badge = card.querySelector<HTMLElement>(`[${BADGE_ATTR}="true"]`);
  if (!badge) {
    badge = document.createElement("div");
    badge.setAttribute(BADGE_ATTR, "true");
    badge.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent("jobsignal:save-candidate-job", { detail: job }));
    });
    const insertionPoint = card.querySelector("a")?.parentElement || card;
    insertionPoint.prepend(badge);
  }

  badge.textContent = `${job.fitScore} ${job.scoreLabel}`;
  badge.title = buildBadgeTitle(job);
  applyBadgeStyles(badge, job.fitScore);
}

function buildBadgeTitle(job: ScoredLinkedInJobCard) {
  const reasons = job.scoreReasons?.length ? `Reasons: ${job.scoreReasons.join(", ")}` : "";
  const risks = job.riskFlags?.length ? `Risks: ${job.riskFlags.join(", ")}` : "";
  return [reasons, risks].filter(Boolean).join("\n");
}

function applyBadgeStyles(badge: HTMLElement, score: number) {
  const colors = score >= 85
    ? { bg: "#052e16", border: "#16a34a", text: "#bbf7d0" }
    : score >= 70
      ? { bg: "#083344", border: "#0891b2", text: "#cffafe" }
      : score >= 40
        ? { bg: "#451a03", border: "#d97706", text: "#fed7aa" }
        : { bg: "#450a0a", border: "#dc2626", text: "#fecaca" };

  badge.style.display = "inline-flex";
  badge.style.alignItems = "center";
  badge.style.justifyContent = "center";
  badge.style.margin = "4px 0 6px";
  badge.style.padding = "3px 7px";
  badge.style.borderRadius = "999px";
  badge.style.border = `1px solid ${colors.border}`;
  badge.style.background = colors.bg;
  badge.style.color = colors.text;
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "800";
  badge.style.lineHeight = "1";
  badge.style.cursor = "pointer";
  badge.style.width = "fit-content";
  badge.style.maxWidth = "100%";
  badge.style.zIndex = "20";
}
