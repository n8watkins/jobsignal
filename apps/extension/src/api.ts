import type { CapturedJob } from "./types";

const DEFAULT_API_BASE = "http://localhost:3002";

export async function getApiBase() {
  const stored = await chrome.storage.sync.get(["apiBase"]);
  return stored.apiBase || DEFAULT_API_BASE;
}

export async function getExtensionConfig() {
  const stored = await chrome.storage.sync.get(["apiBase", "sharedSecret"]);
  return {
    apiBase: (stored.apiBase as string) || DEFAULT_API_BASE,
    sharedSecret: stored.sharedSecret as string | undefined,
  };
}

// JSON headers plus the optional shared secret the API gate checks when set.
export function buildHeaders(sharedSecret?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sharedSecret) headers["x-extension-secret"] = sharedSecret;
  return headers;
}

export async function markApplied(job: CapturedJob) {
  const { apiBase, sharedSecret } = await getExtensionConfig();
  const response = await fetch(`${apiBase}/api/extension/mark-applied`, {
    method: "POST",
    headers: buildHeaders(sharedSecret),
    body: JSON.stringify({ ...job, appliedAt: new Date().toISOString() }),
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const detail = typeof data?.error === "string" ? data.error : data ? JSON.stringify(data.error || data) : text;
    throw new Error(`JobSignal API error ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return data;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
