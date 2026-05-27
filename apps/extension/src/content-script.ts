import { extractCurrentJob } from "./extractors";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "JOBSIGNAL_EXTRACT_JOB") {
    try {
      const captured = extractCurrentJob();
      sendResponse({ ok: true, captured });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown extraction error" });
    }
  }
  return true;
});
