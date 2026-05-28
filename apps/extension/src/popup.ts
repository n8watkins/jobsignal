import { getApiBase } from "./api";
import type { CapturedJob } from "./types";

let currentJob: CapturedJob | null = null;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = $("status");
const debug = $("debug");
const openApplication = $<HTMLAnchorElement>("openApplication");

async function loadLastCaptured() {
  const stored = await chrome.storage.local.get(["lastCapturedJob", "captureReason"]);
  if (stored.lastCapturedJob) {
    fillForm(stored.lastCapturedJob, stored.captureReason);
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  return tab;
}

async function loadInitialCapture() {
  const tab = await getActiveTab();
  const isLinkedInJob = Boolean(tab.url?.includes("linkedin.com/jobs"));

  if (isLinkedInJob) {
    await captureCurrentPage();
    return;
  }

  await loadLastCaptured();
}

function fillForm(job: CapturedJob, captureReason?: string) {
  currentJob = job;
  ($<HTMLInputElement>("companyName")).value = job.companyName || "";
  ($<HTMLInputElement>("roleTitle")).value = job.roleTitle || "";
  ($<HTMLInputElement>("location")).value = job.location || "";
  ($<HTMLInputElement>("resumeLabel")).value = job.resumeLabel || "";
  ($<HTMLSelectElement>("applicationSourceType")).value = job.applicationSourceType || "unknown";
  ($<HTMLInputElement>("recruiterName")).value = job.recruiterName || "";
  ($<HTMLInputElement>("recruiterCompany")).value = job.recruiterCompany || "";
  ($<HTMLTextAreaElement>("recruiterNotes")).value = job.recruiterNotes || "";
  $("payStatus").textContent = job.salaryListed ? job.salaryText || "Listed" : "No pay found";
  $("jdStatus").textContent = job.rawDescription ? `${Math.round(job.rawDescription.length / 100) / 10}k chars` : "Missing";
  debug.textContent = JSON.stringify(job, null, 2);

  if (captureReason === "submit_detected") {
    status.textContent = "LinkedIn submit detected. Review the source tag, then confirm applied.";
  } else if (captureReason === "apply_started") {
    status.textContent = "Easy Apply started. Draft captured — confirm only after submitting.";
  } else {
    status.textContent = job.source === "linkedin"
      ? "Captured LinkedIn job. Review before confirming."
      : "Captured current page. Review carefully before confirming.";
  }

  openApplication.classList.add("hidden");
}

async function captureCurrentPage() {
  status.textContent = "Capturing current page...";
  const tab = await getActiveTab();
  const response = await chrome.tabs.sendMessage(tab.id!, { type: "JOBSIGNAL_EXTRACT_JOB" });
  if (!response?.ok) throw new Error(response?.error || "Extraction failed");
  fillForm(response.captured);
  await chrome.storage.local.set({ lastCapturedJob: response.captured, captureReason: "manual_capture" });
}

async function confirmApplied() {
  if (!currentJob) await captureCurrentPage();
  const payload: CapturedJob = {
    ...currentJob!,
    companyName: ($<HTMLInputElement>("companyName")).value,
    roleTitle: ($<HTMLInputElement>("roleTitle")).value,
    location: ($<HTMLInputElement>("location")).value,
    applicationSourceType: ($<HTMLSelectElement>("applicationSourceType")).value as CapturedJob["applicationSourceType"],
    recruiterName: ($<HTMLInputElement>("recruiterName")).value || undefined,
    recruiterCompany: ($<HTMLInputElement>("recruiterCompany")).value || undefined,
    recruiterNotes: ($<HTMLTextAreaElement>("recruiterNotes")).value || undefined,
    resumeLabel: ($<HTMLInputElement>("resumeLabel")).value || undefined,
    notes: ($<HTMLTextAreaElement>("notes")).value,
  };

  if (!payload.companyName || !payload.roleTitle) {
    throw new Error("Company and role are required before confirming.");
  }

  status.textContent = "Sending to JobSignal...";
  const response = await chrome.runtime.sendMessage({ type: "JOBSIGNAL_MARK_APPLIED", payload });
  if (!response?.ok) throw new Error(response?.error || "API call failed");

  status.textContent = "Tracked in JobSignal.";
  debug.textContent = JSON.stringify(response.data, null, 2);

  if (response.data?.applicationUrl) {
    const base = await getApiBase();
    openApplication.href = `${base}${response.data.applicationUrl}`;
    openApplication.classList.remove("hidden");
  }
}

$("capture").addEventListener("click", () => captureCurrentPage().catch((error) => (status.textContent = error.message)));
$("markApplied").addEventListener("click", () => confirmApplied().catch((error) => (status.textContent = error.message)));

loadInitialCapture().catch((error) => {
  status.textContent = error.message || "Could not capture current page. Try the Capture button.";
  loadLastCaptured().catch(() => undefined);
});
