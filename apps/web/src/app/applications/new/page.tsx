"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Textarea } from "@/components/ui";

export default function NewApplicationPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        setError(`Server error ${response.status}: ${text.slice(0, 300)}`);
        return;
      }
      const data = await response.json();
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

  return (
    <AppShell>
      <header className="mb-6"><h1 className="text-3xl font-semibold tracking-tight text-white">New Application</h1><p className="mt-2 text-slate-400">Manual fallback flow. The extension will call the same backend shape later.</p></header>
      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-4 p-5">
          <label className="block text-sm text-slate-300">Company<Input name="companyName" className="mt-2" placeholder="Stripe" required /></label>
          <label className="block text-sm text-slate-300">Role<Input name="roleTitle" className="mt-2" placeholder="Frontend Developer" required /></label>
          <label className="block text-sm text-slate-300">Job URL<Input name="jobUrl" className="mt-2" placeholder="https://..." /></label>
          <label className="block text-sm text-slate-300">Source<Input name="source" className="mt-2" placeholder="LinkedIn" /></label>
          <label className="block text-sm text-slate-300">Location<Input name="location" className="mt-2" placeholder="Remote" /></label>
          <Button type="submit" disabled={loading} className="w-full bg-white text-slate-950 hover:bg-slate-200">{loading ? "Saving…" : "Create + Analyze"}</Button>
        </Card>
        <Card className="p-5"><label className="block text-sm text-slate-300">Job Description<Textarea name="rawDescription" className="mt-2 min-h-[420px]" placeholder="Paste JD here..." /></label></Card>
      </form>
      {error ? <Card className="mt-4 p-5"><pre className="overflow-x-auto text-xs text-red-400">{error}</pre></Card> : null}
    </AppShell>
  );
}
