import { markApplied } from "./api";
import type { CapturedJob } from "./types";

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "mark-applied") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const response = await chrome.tabs.sendMessage(tab.id, { type: "JOBSIGNAL_EXTRACT_JOB" }).catch(() => null);
  if (!response?.ok) {
    chrome.action.setBadgeText({ text: "ERR", tabId: tab.id });
    return;
  }

  await chrome.storage.local.set({ lastCapturedJob: response.captured });
  // Store only. Popup lets user review before confirming.
  chrome.action.openPopup?.();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "JOBSIGNAL_MARK_APPLIED") {
    markApplied(message.payload as CapturedJob)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown API error" }));
    return true;
  }
});
