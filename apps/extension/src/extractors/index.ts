import type { CapturedJob } from "../types";
import { extractGenericJob } from "./generic";
import { extractLinkedInJob } from "./linkedin";

export function extractCurrentJob(): CapturedJob {
  if (location.hostname.includes("linkedin.com")) return extractLinkedInJob();
  return extractGenericJob();
}
