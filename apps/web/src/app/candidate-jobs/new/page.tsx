"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCandidateJobPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    source: "manual",
    jobUrl: "",
    companyName: "",
    roleTitle: "",
    location: "",
    salaryText: "",
    rawDescription: "",
  });

  async function submitJob(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Saving...");

    const response = await fetch("/api/candidate-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        rawCardText: [form.companyName, form.roleTitle, form.location, form.salaryText, form.rawDescription].filter(Boolean).join(" "),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      setStatus(`Failed: ${text}`);
      return;
    }

    setStatus("Saved.");
    router.push("/candidate-jobs");
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">JobSignal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Add Candidate Job</h1>
        <p className="mt-2 text-sm text-slate-400">Paste a job manually, score it, and save it to Job Radar before it becomes an application.</p>

        <form onSubmit={submitJob} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Field label="Job URL" value={form.jobUrl} onChange={(value) => updateField("jobUrl", value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company" value={form.companyName} onChange={(value) => updateField("companyName", value)} required />
            <Field label="Role" value={form.roleTitle} onChange={(value) => updateField("roleTitle", value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
            <Field label="Salary" value={form.salaryText} onChange={(value) => updateField("salaryText", value)} />
          </div>

          <label className="block text-sm text-slate-300">
            Job description / notes
            <textarea
              value={form.rawDescription}
              onChange={(event) => updateField("rawDescription", event.target.value)}
              className="mt-2 min-h-48 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
              placeholder="Paste the JD text here..."
            />
          </label>

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Save + Score</button>
            <button type="button" onClick={() => router.push("/candidate-jobs")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Cancel</button>
            {status ? <span className="text-sm text-slate-400">{status}</span> : null}
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400" />
    </label>
  );
}
