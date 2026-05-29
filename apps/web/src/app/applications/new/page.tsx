"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import type { JobExtraction } from "@jobsignal/shared";

type Fields = { companyName: string; roleTitle: string; jobUrl: string; source: string; location: string };
const empty: Fields = { companyName: "", roleTitle: "", jobUrl: "", source: "", location: "" };

export default function NewApplicationPage() {
  const [fields, setFields] = useState<Fields>(empty);
  const [rawDescription, setRawDescription] = useState("");
  const [parsed, setParsed] = useState<JobExtraction | null>(null);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function parseJD() {
    if (!rawDescription.trim()) return;
    setParsing(true);
    setParsed(null);
    try {
      const res = await fetch("/api/extract-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription }),
      });
      if (!res.ok) return;
      const { extraction } = await res.json() as { extraction: JobExtraction };
      setParsed(extraction);
      setFields((prev) => ({
        companyName: prev.companyName || extraction.companyName || "",
        roleTitle:   prev.roleTitle   || extraction.roleTitle   || "",
        jobUrl:      prev.jobUrl,
        source:      prev.source,
        location:    prev.location    || extraction.location    || "",
      }));
    } finally {
      setParsing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, rawDescription }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Server error ${res.status}: ${text.slice(0, 300)}`);
        return;
      }
      const data = await res.json();
      if (data.applicationUrl) {
        window.location.href = data.applicationUrl;
        return;
      }
      setError(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const hasTechs = parsed && parsed.techStack.length > 0;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">New Application</h1>
        <p className="mt-2 text-slate-400">Paste the job description — click Parse to auto-fill fields.</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-4 p-5">
          <label className="block text-sm text-slate-300">
            Company
            <Input value={fields.companyName} onChange={set("companyName")} className="mt-2" placeholder="Stripe" />
          </label>
          <label className="block text-sm text-slate-300">
            Role
            <Input value={fields.roleTitle} onChange={set("roleTitle")} className="mt-2" placeholder="Senior Software Engineer" />
          </label>
          <label className="block text-sm text-slate-300">
            Location
            <Input value={fields.location} onChange={set("location")} className="mt-2" placeholder="Remote" />
          </label>
          <label className="block text-sm text-slate-300">
            Job URL
            <Input value={fields.jobUrl} onChange={set("jobUrl")} className="mt-2" placeholder="https://..." />
          </label>
          <label className="block text-sm text-slate-300">
            Source
            <Input value={fields.source} onChange={set("source")} className="mt-2" placeholder="LinkedIn" />
          </label>

          {parsed ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <Sparkles size={13} /> Parsed
              </div>
              {parsed.seniorityLevel && <p>Seniority: <span className="text-slate-200">{parsed.seniorityLevel}</span></p>}
              {parsed.workplaceType !== "unknown" && <p>Work: <span className="text-slate-200">{parsed.workplaceType}</span></p>}
              {parsed.employmentType !== "unknown" && <p>Type: <span className="text-slate-200">{parsed.employmentType}</span></p>}
              {parsed.salaryText && <p>Salary: <span className="text-slate-200">{parsed.salaryText}</span></p>}
              {!parsed.salaryListed && <p className="text-amber-400">No salary listed</p>}
              <p>Confidence: <span className="text-slate-200">{Math.round(parsed.confidence * 100)}%</span></p>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading || (!fields.companyName && !rawDescription)}
            className="w-full bg-white text-slate-950 hover:bg-slate-200"
          >
            {loading ? "Saving…" : "Save + Analyze"}
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Job Description</label>
            <Button
              type="button"
              onClick={parseJD}
              disabled={parsing || !rawDescription.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Sparkles size={13} />
              {parsing ? "Parsing…" : "Parse JD"}
            </Button>
          </div>

          <Textarea
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            className="min-h-[360px] flex-1"
            placeholder="Paste the full job description here, then click Parse JD…"
          />

          {hasTechs ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                Detected technologies ({parsed.techStack.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {parsed.requiredSkills.map((t) => (
                  <Badge key={t} className="border-indigo-400/20 bg-indigo-500/10 text-indigo-300 text-xs">{t}</Badge>
                ))}
                {parsed.niceToHaveSkills.map((t) => (
                  <Badge key={t} className="border-white/10 bg-white/5 text-slate-400 text-xs">{t}</Badge>
                ))}
                {parsed.techStack
                  .filter((t) => !parsed.requiredSkills.includes(t) && !parsed.niceToHaveSkills.includes(t))
                  .map((t) => (
                    <Badge key={t} className="border-white/10 bg-white/5 text-slate-400 text-xs">{t}</Badge>
                  ))}
              </div>
              {parsed.emphasisAreas?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {parsed.emphasisAreas.map((a) => (
                    <Badge key={a} className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300 text-xs">{a}</Badge>
                  ))}
                </div>
              ) : null}
              {parsed.redFlags.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {parsed.redFlags.map((f) => (
                    <Badge key={f} className="border-red-400/20 bg-red-500/10 text-red-300 text-xs">{f}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      </form>

      {error ? <Card className="mt-4 p-5"><pre className="overflow-x-auto text-xs text-red-400">{error}</pre></Card> : null}
    </AppShell>
  );
}
