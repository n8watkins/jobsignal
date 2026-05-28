import { saveCandidateJob, scoreVisibleCandidateJobs } from "./candidateJobApi";
import type { LinkedInJobCard, ScoredLinkedInJobCard } from "./candidateJobTypes";
import { extractLinkedInSidebarJobs } from "./linkedinJobList";
import { attachScoresToLinkedInCards } from "./sidebarScoreOverlay";

const globalKey = "__jobsignalLinkedInRadarStarted";
const scoredJobCache = new Map<string, ScoredLinkedInJobCard>();
let scanTimer: number | undefined;
let lastPathname = location.pathname;

export function startLinkedInJobRadar() {
  if (!location.hostname.includes("linkedin.com")) return;
  if (!location.pathname.includes("/jobs")) {
    watchForLinkedInJobsNavigation();
    return;
  }

  const globalObject = window as typeof window & Record<string, unknown>;
  if (globalObject[globalKey]) return;
  globalObject[globalKey] = true;

  window.addEventListener("jobsignal:save-candidate-job", ((event: CustomEvent<LinkedInJobCard>) => {
    const job = event.detail;
    saveCandidateJob(job)
      .then(() => showRadarToast("Saved to Job Radar."))
      .catch((error) => showRadarToast(error instanceof Error ? error.message : "Could not save candidate job."));
  }) as EventListener);

  const observer = new MutationObserver(() => scheduleLinkedInSidebarScan());
  observer.observe(document.body, { childList: true, subtree: true });
  watchForLinkedInJobsNavigation();
  scheduleLinkedInSidebarScan();
}

function watchForLinkedInJobsNavigation() {
  window.setInterval(() => {
    if (location.pathname === lastPathname) return;
    lastPathname = location.pathname;
    if (location.pathname.includes("/jobs")) scheduleLinkedInSidebarScan();
  }, 1200);
}

function scheduleLinkedInSidebarScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    scanLinkedInSidebar().catch((error) => console.warn("[JobSignal] sidebar scan failed", error));
  }, 500);
}

async function scanLinkedInSidebar() {
  const jobs = extractLinkedInSidebarJobs();
  const cachedMatches: ScoredLinkedInJobCard[] = [];
  const unscoredJobs: LinkedInJobCard[] = [];

  for (const job of jobs) {
    const key = getJobKey(job);
    if (!key) continue;

    const cached = scoredJobCache.get(key);
    if (cached) cachedMatches.push(cached);
    else unscoredJobs.push(job);
  }

  if (cachedMatches.length > 0) attachScoresToLinkedInCards(cachedMatches);
  if (unscoredJobs.length === 0) return;

  const scoredJobs = await scoreVisibleCandidateJobs(unscoredJobs);
  for (const job of scoredJobs) {
    const key = getJobKey(job);
    if (key) scoredJobCache.set(key, job);
  }
  attachScoresToLinkedInCards(scoredJobs);
}

function getJobKey(job: LinkedInJobCard) {
  return job.sourceJobId || job.jobUrl || job.elementKey;
}

function showRadarToast(message: string) {
  const existing = document.getElementById("jobsignal-radar-toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.id = "jobsignal-radar-toast";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.right = "20px";
  toast.style.bottom = "20px";
  toast.style.zIndex = "2147483647";
  toast.style.maxWidth = "360px";
  toast.style.padding = "12px 14px";
  toast.style.borderRadius = "14px";
  toast.style.border = "1px solid rgba(255,255,255,.16)";
  toast.style.background = "#020617";
  toast.style.color = "#e2e8f0";
  toast.style.font = "600 13px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  toast.style.boxShadow = "0 20px 50px rgba(0,0,0,.35)";
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4500);
}
