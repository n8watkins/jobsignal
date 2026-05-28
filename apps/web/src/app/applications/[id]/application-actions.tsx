"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPLICATION_STATUSES } from "@jobsignal/shared";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  applied: "Applied",
  application_confirmed: "Confirmed",
  recruiter_responded: "Recruiter Replied",
  interview_requested: "Interview Requested",
  assessment_requested: "Assessment",
  interviewing: "Interviewing",
  offer_final_stage: "Offer / Final Stage",
  rejected: "Rejected",
  archived: "Archived",
  not_pursuing: "Not Pursuing",
};

export function ApplicationStatusSelect({ applicationId, currentStatus }: { applicationId: string; currentStatus: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Failed to update status (${res.status}): ${text.slice(0, 100)}`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        defaultValue={currentStatus}
        onChange={onChange}
        disabled={saving}
        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-400/50 disabled:opacity-50"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
