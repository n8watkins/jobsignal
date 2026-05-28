import { saveCandidateJob, scoreVisibleCandidateJobs } from "./candidateJobApi";
import type { LinkedInJobCard } from "./candidateJobTypes";
import { extractLinkedInSidebarJobs } from "./linkedinJobList";
import { attachScoresToLinkedInCards } from "./sidebarScoreOverlay";

const globalKey = "__jobsignalLinkedInRadarStarted";
const scoredJobCache = new Map<string, number>();
let scanTimer: number | undefined;

export function startLinkedInJobRadar() {
  const globalObject = window as typeof window & Record<string, unknown>;
  if (globalObject[globalKey]) return;
  globalObject[globalKey] = true;

  if (!location.hostname.includes("linkedin.com")) return;
  if (!location.pathname.includes("/jobs")) return;

  window.addEventListener("jobsignal:save-candidate-job", ((event: CustomEvent<LinkedInJobCard>) => {
    const job = event.detail;
    saveCandidateJob(job)
      .then(() => showRadarToast("Saved to Job Radar."))
      .catch((error) => showRadarToast(error instanceof Error ? error.message : "Could not save candidate job."));
  }) as EventListener);

  const observer = new MutationObserver(() => scheduleLinkedInSidebarScan());
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleLinkedInSidebarScan();
}

function scheduleLinkedInSidebarScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    scanLinkedInSidebar().catch((error) => console.warn("[JobSignal] sidebar scan failed", error));
  }, 500);
}

async function scanLinkedInSidebar() {
  const jobs = extractLinkedInSidebarJobs();
  const unscoredJobs = jobs.filter((job) => {
    const key = job.sourceJobId || job.elementKey;
    return key && !scoredJobCache.has(key);
  });

  if (unscoredJobs.length === 0) return;

  const scoredJobs = await scoreVisibleCandidateJobs(unscoredJobs);
  for (const job of scoredJobs) {
    const key = job.sourceJobId || job.elementKey;
    if (key) scoredJobCache.set(key, job.fitScore);
  }
  attachScoresToLinkedInCards(scoredJobs);
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
