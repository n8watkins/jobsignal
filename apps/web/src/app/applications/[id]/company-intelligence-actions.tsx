"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QueueCompanyResearchButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function queueResearch() {
    setStatus("Queueing research...");
    const response = await fetch(`/api/applications/${applicationId}/queue-research`, { method: "POST" });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "Could not queue research.");
      return;
    }

    setStatus("Research queued.");
    router.refresh();
  }

  return (
    <button
      onClick={queueResearch}
      className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
    >
      {status || "Queue Research"}
    </button>
  );
}
