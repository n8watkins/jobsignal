const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

function headers(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export type GmailMessagePart = {
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  snippet: string;
  payload?: GmailMessagePart;
  internalDate?: string;
};

export type GmailThread = {
  id: string;
  messages: GmailMessage[];
};

export async function searchThreads(
  accessToken: string,
  query: string,
  maxResults = 50
): Promise<Array<{ id: string; threadId: string }>> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const res = await fetch(`${BASE}/threads?${params}`, { headers: headers(accessToken) });
  if (!res.ok) throw new Error(`Gmail threads search failed: ${res.status}`);
  const data = await res.json() as { threads?: Array<{ id: string; threadId: string }> };
  return data.threads ?? [];
}

export async function getThread(accessToken: string, threadId: string): Promise<GmailThread> {
  const params = new URLSearchParams({ format: "metadata", metadataHeaders: "From,Subject,Date" });
  const res = await fetch(`${BASE}/threads/${threadId}?${params}`, { headers: headers(accessToken) });
  if (!res.ok) throw new Error(`Gmail get thread failed: ${res.status}`);
  return res.json() as Promise<GmailThread>;
}

export async function archiveThread(accessToken: string, threadId: string): Promise<void> {
  const res = await fetch(`${BASE}/threads/${threadId}/modify`, {
    method: "POST",
    headers: { ...headers(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
  });
  if (!res.ok) throw new Error(`Gmail archive failed: ${res.status}`);
}

export function extractHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}
