"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CandidateJobActions({ id, jobUrl }: { id: string; jobUrl?: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function updateStatus(nextStatus: string) {
    setStatus(`Marking ${nextStatus}...`);
    const response = await fetch(`/api/candidate-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) {
      setStatus("Failed to update status.");
      return;
    }
    setStatus(`Marked ${nextStatus}.`);
    router.refresh();
  }

  async function promoteToApplication() {
    setStatus("Creating application...");
    const response = await fetch(`/api/candidate-jobs/${id}/promote`, { method: "POST" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "Failed to create application.");
      return;
    }
    router.push(data.applicationUrl || "/applications");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-semibold text-white">Actions</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {jobUrl ? <a href={jobUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Open Job</a> : null}
        <button onClick={() => updateStatus("interested")} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">Interested</button>
        <button onClick={() => updateStatus("skipped")} className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400">Skip</button>
        <button onClick={promoteToApplication} className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Mark Applied</button>
        <button onClick={() => updateStatus("archived")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Archive</button>
      </div>
      {status ? <p className="mt-3 text-sm text-slate-400">{status}</p> : null}
    </div>
  );
}
