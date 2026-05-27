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

  await chrome.storage.local.set({ lastCapturedJob: response.captured, captureReason: "shortcut" });
  chrome.action.openPopup?.();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "JOBSIGNAL_MARK_APPLIED") {
    markApplied(message.payload as CapturedJob)
      .then(async (data) => {
        await chrome.storage.local.remove(["pendingStartCapture", "pendingSubmitCapture", "captureReason"]);
        sendResponse({ ok: true, data });
      })
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown API error" }));
    return true;
  }

  if (message?.type === "JOBSIGNAL_APPLICATION_STARTED_DETECTED") {
    const payload = message.payload as CapturedJob;
    chrome.storage.local.set({
      lastCapturedJob: payload,
      pendingStartCapture: payload,
      captureReason: "apply_started",
    });

    if (sender.tab?.id) {
      chrome.action.setBadgeText({ text: "DRAFT", tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#64748b", tabId: sender.tab.id });
    }

    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "JOBSIGNAL_APPLICATION_SUBMITTED_DETECTED") {
    const payload = message.payload as CapturedJob;
    chrome.storage.local.set({
      lastCapturedJob: payload,
      pendingSubmitCapture: payload,
      captureReason: "submit_detected",
    });

    if (sender.tab?.id) {
      chrome.action.setBadgeText({ text: "NEW", tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId: sender.tab.id });
    }

    sendResponse({ ok: true });
    return true;
  }
});
