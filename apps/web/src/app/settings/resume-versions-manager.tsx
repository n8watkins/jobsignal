"use client";

import { useEffect, useState } from "react";
import { Button, Input, Textarea, Badge } from "@/components/ui";

type ResumeVersion = {
  id: string;
  name: string;
  isDefault: boolean;
  characterCount: number;
  updatedAt: string;
};

export function ResumeVersionsManager() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rawText, setRawText] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/resume-versions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVersions(data.resumeVersions || []);
      setError(null);
    } catch {
      setError("Couldn't load resumes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (rawText.trim().length < 50) {
      setError("Paste at least 50 characters of resume text.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/resume-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Untitled resume", rawText, isDefault: makeDefault }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setRawText("");
      setMakeDefault(false);
      await load();
    } catch {
      setError("Couldn't save resume.");
    } finally {
      setAdding(false);
    }
  }

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/resume-versions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Couldn't set default.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/resume-versions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError("Couldn't delete resume.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-slate-400">
        The default resume is the baseline for job-fit analysis on new applications.
      </p>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-slate-500">No resumes yet. Add one below.</p>
        ) : (
          versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{v.name}</span>
                  {v.isDefault && (
                    <Badge className="border-indigo-400/20 bg-indigo-500/10 text-indigo-300">Default</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{v.characterCount.toLocaleString()} chars</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!v.isDefault && (
                  <Button onClick={() => setDefault(v.id)} disabled={busyId === v.id}>
                    Set default
                  </Button>
                )}
                <Button
                  onClick={() => remove(v.id)}
                  disabled={busyId === v.id}
                  className="border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <label className="block text-sm text-slate-300">
          Name
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Frontend Resume v3" />
        </label>
        <label className="block text-sm text-slate-300">
          Resume text
          <Textarea
            className="mt-1"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the full resume text…"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
          Set as default
        </label>
        <Button
          onClick={add}
          disabled={adding}
          className="border-indigo-400/30 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30"
        >
          {adding ? "Saving…" : "Add resume"}
        </Button>
      </div>
    </div>
  );
}
