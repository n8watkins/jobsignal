"use client";

import { useState } from "react";
import { Badge, Card, Button, Input, Textarea } from "@/components/ui";
import type { JobSearchProfileValues } from "@/lib/profile/profile-utils";

type ListField = keyof Pick<
  JobSearchProfileValues,
  "targetRoles" | "strongTechnologies" | "secondaryTechnologies" | "learningTechnologies" | "avoidTerms"
>;

const LIST_FIELDS: { key: ListField; label: string; danger?: boolean }[] = [
  { key: "targetRoles", label: "Target Roles" },
  { key: "strongTechnologies", label: "Strong Technologies" },
  { key: "secondaryTechnologies", label: "Secondary Technologies" },
  { key: "learningTechnologies", label: "Learning / Gap Technologies" },
  { key: "avoidTerms", label: "Avoid Terms", danger: true },
];

function Select({ value, onChange, options, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-200 outline-none focus:border-indigo-400/50 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ProfileForm({ initialProfile }: { initialProfile: JobSearchProfileValues }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(profile);
    setIsEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Convert textarea strings (one per line) back to arrays for list fields
      const body = {
        ...draft,
        targetRoles: listOrString(draft.targetRoles),
        strongTechnologies: listOrString(draft.strongTechnologies),
        secondaryTechnologies: listOrString(draft.secondaryTechnologies),
        learningTechnologies: listOrString(draft.learningTechnologies),
        avoidTerms: listOrString(draft.avoidTerms),
      };
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setProfile(data.profile);
      setIsEditing(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function setListDraft(key: ListField, value: string | string[]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setScalarDraft(key: keyof JobSearchProfileValues, value: string | number | null) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  // In edit mode, list fields are stored as newline-joined strings for textarea
  function draftAsText(key: ListField): string {
    const val = draft[key];
    return Array.isArray(val) ? val.join("\n") : val as string;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">JobSignal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Job Search Profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Controls how Job Radar scores sourced jobs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-rose-400">{error}</span>}
          {isEditing ? (
            <>
              <Button onClick={cancelEdit} disabled={saving}>Cancel</Button>
              <Button
                onClick={save}
                disabled={saving}
                className="border-indigo-400/30 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <Button onClick={startEdit}>Edit Profile</Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {LIST_FIELDS.map(({ key, label, danger }) =>
          isEditing ? (
            <Card key={key} className="p-5">
              <label className="block">
                <span className="font-semibold text-white">{label}</span>
                <span className="ml-2 text-xs text-slate-500">one per line</span>
                <Textarea
                  className="mt-3"
                  value={draftAsText(key)}
                  onChange={(e) => setListDraft(key, e.target.value)}
                  rows={5}
                />
              </label>
            </Card>
          ) : (
            <Card key={key} className="p-5">
              <h2 className="font-semibold text-white">{label}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile[key] as string[]).map((item) => (
                  <Badge
                    key={item}
                    className={
                      danger
                        ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </Card>
          )
        )}

        {/* Preferences card */}
        <Card className="p-5">
          <h2 className="font-semibold text-white">Preferences</h2>
          {isEditing ? (
            <div className="mt-4 space-y-4 text-sm">
              <label className="block text-slate-300">
                Work arrangement
                <Select
                  className="mt-1 w-full"
                  value={draft.preferredWorkArrangement}
                  onChange={(v) => setScalarDraft("preferredWorkArrangement", v)}
                  options={[
                    { value: "remote_or_hybrid", label: "Remote or hybrid" },
                    { value: "remote_only", label: "Remote only" },
                    { value: "onsite_ok", label: "Onsite OK" },
                  ]}
                />
              </label>
              <label className="block text-slate-300">
                Employment type
                <Select
                  className="mt-1 w-full"
                  value={draft.preferredEmploymentType}
                  onChange={(v) => setScalarDraft("preferredEmploymentType", v)}
                  options={[
                    { value: "full_time", label: "Full-time" },
                    { value: "contract", label: "Contract" },
                    { value: "either", label: "Either" },
                  ]}
                />
              </label>
              <label className="block text-slate-300">
                Salary floor
                <Input
                  className="mt-1"
                  type="number"
                  value={draft.salaryFloor ?? ""}
                  onChange={(e) =>
                    setScalarDraft("salaryFloor", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="e.g. 100000"
                />
              </label>
              <label className="block text-slate-300">
                Location
                <Input
                  className="mt-1"
                  value={draft.preferredLocation ?? ""}
                  onChange={(e) => setScalarDraft("preferredLocation", e.target.value || null)}
                  placeholder="e.g. Los Angeles / Remote"
                />
              </label>
              <label className="block text-slate-300">
                Recruiter tolerance
                <Select
                  className="mt-1 w-full"
                  value={draft.recruiterTolerance}
                  onChange={(v) => setScalarDraft("recruiterTolerance", v)}
                  options={[
                    { value: "open", label: "Open" },
                    { value: "neutral", label: "Neutral" },
                    { value: "skeptical", label: "Skeptical" },
                  ]}
                />
              </label>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <Meta label="Work arrangement" value={profile.preferredWorkArrangement} />
              <Meta label="Employment type" value={profile.preferredEmploymentType} />
              <Meta
                label="Salary floor"
                value={profile.salaryFloor ? `$${profile.salaryFloor.toLocaleString()}` : "Not set"}
              />
              <Meta label="Location" value={profile.preferredLocation ?? "Not set"} />
              <Meta label="Recruiter tolerance" value={profile.recruiterTolerance} />
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function listOrString(val: string | string[]): string | string[] {
  return val;
}
