import type { CapturedJob } from "./types";

const DEFAULT_API_BASE = "http://localhost:3000";

export async function getApiBase() {
  const stored = await chrome.storage.sync.get(["apiBase"]);
  return stored.apiBase || DEFAULT_API_BASE;
}

export async function markApplied(job: CapturedJob) {
  const apiBase = await getApiBase();
  const response = await fetch(`${apiBase}/api/extension/mark-applied`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...job, appliedAt: new Date().toISOString() }),
  });

  if (!response.ok) {
    throw new Error(`JobSignal API error: ${response.status}`);
  }

  return response.json();
}
