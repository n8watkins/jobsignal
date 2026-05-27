import type { CapturedJob } from "./types";

let currentJob: CapturedJob | null = null;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = $("status");
const debug = $("debug");

async function loadLastCaptured() {
  const stored = await chrome.storage.local.get(["lastCapturedJob"]);
  if (stored.lastCapturedJob) fillForm(stored.lastCapturedJob);
}

function fillForm(job: CapturedJob) {
  currentJob = job;
  ($<HTMLInputElement>("companyName")).value = job.companyName || "";
  ($<HTMLInputElement>("roleTitle")).value = job.roleTitle || "";
  ($<HTMLInputElement>("location")).value = job.location || "";
  debug.textContent = JSON.stringify(job, null, 2);
  status.textContent = "Captured job. Review before confirming.";
}

async function captureCurrentPage() {
  status.textContent = "Capturing current page...";
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  const response = await chrome.tabs.sendMessage(tab.id, { type: "JOBSIGNAL_EXTRACT_JOB" });
  if (!response?.ok) throw new Error(response?.error || "Extraction failed");
  fillForm(response.captured);
  await chrome.storage.local.set({ lastCapturedJob: response.captured });
}

async function confirmApplied() {
  if (!currentJob) await captureCurrentPage();
  const payload: CapturedJob = {
    ...currentJob!,
    companyName: ($<HTMLInputElement>("companyName")).value,
    roleTitle: ($<HTMLInputElement>("roleTitle")).value,
    location: ($<HTMLInputElement>("location")).value,
    resumeVersionId: ($<HTMLSelectElement>("resumeVersionId")).value,
    notes: ($<HTMLTextAreaElement>("notes")).value,
  };

  status.textContent = "Sending to JobSignal...";
  const response = await chrome.runtime.sendMessage({ type: "JOBSIGNAL_MARK_APPLIED", payload });
  if (!response?.ok) throw new Error(response?.error || "API call failed");
  status.textContent = "Tracked in JobSignal.";
  debug.textContent = JSON.stringify(response.data, null, 2);
}

$("capture").addEventListener("click", () => captureCurrentPage().catch((error) => (status.textContent = error.message)));
$("markApplied").addEventListener("click", () => confirmApplied().catch((error) => (status.textContent = error.message)));

loadLastCaptured().catch(() => undefined);
