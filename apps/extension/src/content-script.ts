import { extractCurrentJob } from "./extractors";
import { startLinkedInJobRadar } from "./linkedinRadar";

const START_APPLY_TEXT_PATTERN = /^(easy apply|apply|apply now)$/i;
const SUBMIT_TEXT_PATTERN = /^(submit application|submit|send application)$/i;

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

document.addEventListener(
  "click",
  (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest("button, a[role='button']");
    const buttonText = button?.textContent?.replace(/\s+/g, " ").trim();

    if (!button || !buttonText) return;

    if (START_APPLY_TEXT_PATTERN.test(buttonText)) {
      captureApplicationSignal("JOBSIGNAL_APPLICATION_STARTED_DETECTED", "Application started. JobSignal saved a draft snapshot for this LinkedIn job.", 250);
      return;
    }

    if (SUBMIT_TEXT_PATTERN.test(buttonText)) {
      captureApplicationSignal("JOBSIGNAL_APPLICATION_SUBMITTED_DETECTED", "Application submit detected. JobSignal captured this job — click the extension to confirm.", 700);
    }
  },
  true,
);

function captureApplicationSignal(messageType: string, toastMessage: string, delayMs: number) {
  window.setTimeout(() => {
    try {
      const captured = extractCurrentJob();
      chrome.runtime.sendMessage({ type: messageType, payload: captured });
      showJobSignalToast(toastMessage);
    } catch {
      showJobSignalToast("JobSignal detected the application flow, but could not capture the job. Click the extension to capture manually.");
    }
  }, delayMs);
}

function showJobSignalToast(message: string) {
  const existing = document.getElementById("jobsignal-submit-toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.id = "jobsignal-submit-toast";
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

  window.setTimeout(() => toast.remove(), 7000);
}

startLinkedInJobRadar();
