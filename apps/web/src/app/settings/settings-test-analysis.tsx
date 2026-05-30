"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";

const SAMPLE_JD = `Senior Frontend Engineer — Stripe
San Francisco, CA (Hybrid) · Full-time · $180,000–$240,000/yr

About Stripe
Stripe is a technology company that builds economic infrastructure for the internet. We're looking for a Senior Frontend Engineer to help build our next-generation dashboard.

Requirements
- 5+ years of experience with React and TypeScript
- Strong understanding of performance optimization and browser internals
- Experience with GraphQL and REST APIs
- Familiarity with testing frameworks (Jest, Playwright)

Nice to have
- Experience with Next.js
- Contributions to open-source projects

Benefits
- Comprehensive health, dental, and vision coverage
- 401(k) with company match
- $5,000 annual learning stipend`;

export function SettingsTestAnalysis() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: SAMPLE_JD }),
      });
      const data = await res.json() as Record<string, unknown>;
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-slate-400">
        Run a sample job description through the heuristic analysis engine.
      </p>
      <Button onClick={run} disabled={loading}>
        {loading ? "Analyzing…" : "Test Analysis"}
      </Button>
      {result && (
        <Card className="p-4">
          <pre className="overflow-x-auto text-xs text-slate-300 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
