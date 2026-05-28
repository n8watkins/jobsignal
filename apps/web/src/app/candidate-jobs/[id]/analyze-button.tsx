"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeCandidateJobButton({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function analyze() {
    setStatus("Analyzing...");
    const response = await fetch(`/api/candidate-jobs/${id}/analyze`, { method: "POST" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "Analysis failed.");
      return;
    }
    setStatus(data.aiEnabled ? "AI analysis saved." : "Heuristic analysis saved.");
    router.refresh();
  }

  return (
    <div>
      <button onClick={analyze} className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">
        Analyze JD
      </button>
      {status ? <p className="mt-2 text-sm text-slate-400">{status}</p> : null}
    </div>
  );
}
