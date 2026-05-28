"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QueueAppliedResearchButton() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function queueApplied() {
    setStatus("Queueing applied companies...");
    const response = await fetch("/api/research/queue", { method: "POST" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "Failed to queue research.");
      return;
    }
    setStatus(`Queued/confirmed ${data.queuedCount} research tasks.`);
    router.refresh();
  }

  return (
    <div>
      <button onClick={queueApplied} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
        Queue Applied Companies
      </button>
      {status ? <p className="mt-2 text-sm text-slate-400">{status}</p> : null}
    </div>
  );
}

export function RunPlaceholderTaskButton({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function runTask() {
    setStatus("Running placeholder research...");
    const response = await fetch(`/api/research/tasks/${id}/run-placeholder`, { method: "POST" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "Failed.");
      return;
    }
    setStatus(data.skipped ? data.reason || "Skipped." : "Completed.");
    router.refresh();
  }

  return (
    <div>
      <button onClick={runTask} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
        Run Placeholder
      </button>
      {status ? <p className="mt-2 text-xs text-slate-500">{status}</p> : null}
    </div>
  );
}
