"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";

type EmailEvent = {
  id: string;
  senderEmail: string;
  senderName: string | null;
  subject: string;
  snippet: string;
  receivedAt: Date | string;
  classification: string;
  correctedClassification: string | null;
  confidence: number;
  reason: string | null;
  reviewStatus: string;
  archivedInGmail: boolean;
  actionNeeded: boolean;
  suggestedNextAction: string | null;
  application: {
    id: string;
    jobPosting: { companyName: string; roleTitle: string };
  } | null;
};

const CLASSIFICATIONS = [
  "rejection",
  "interview_request",
  "assessment_request",
  "application_confirmation",
  "offer",
  "recruiter_outreach",
  "manual_review",
];

export function InboxTable({
  events,
  gmailConnected,
}: {
  events: EmailEvent[];
  gmailConnected: boolean;
}) {
  const router = useRouter();
  const [scanning, startScan] = useTransition();
  const [selected, setSelected] = useState<EmailEvent | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  async function scan() {
    startScan(async () => {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const data = await res.json() as { created?: number; error?: string };
      setScanResult(res.ok ? `${data.created ?? 0} new signals found` : (data.error ?? "Scan failed"));
      router.refresh();
    });
  }

  async function confirm(id: string) {
    setBusy(id);
    await fetch(`/api/gmail/email-events/${id}/confirm`, { method: "POST" });
    setBusy(null);
    setSelected(null);
    router.refresh();
  }

  async function correct(id: string, classification: string) {
    setBusy(id);
    await fetch(`/api/gmail/email-events/${id}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classification }),
    });
    setBusy(null);
    setCorrectingId(null);
    setSelected(null);
    router.refresh();
  }

  async function archive(id: string) {
    setBusy(id);
    await fetch(`/api/gmail/email-events/${id}/archive`, { method: "POST" });
    setBusy(null);
    setSelected(null);
    router.refresh();
  }

  const displayClassification = (e: EmailEvent) => e.correctedClassification ?? e.classification;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Email Signals</h2>
          {scanResult && <p className="mt-1 text-sm text-slate-400">{scanResult}</p>}
        </div>
        <Button
          onClick={scan}
          disabled={scanning || !gmailConnected}
          className="bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-50"
        >
          {scanning ? "Scanning…" : "Scan Gmail"}
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          {gmailConnected
            ? "No email signals yet — click Scan Gmail to import."
            : "Connect Gmail in Settings to start scanning."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Company / Sender</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {events.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="cursor-pointer transition hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {e.application?.jobPosting.companyName ?? e.senderName ?? e.senderEmail}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{e.senderEmail}</div>
                  </td>
                  <td className="max-w-xs px-5 py-4">
                    <div className="truncate text-slate-200">{e.subject}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={displayClassification(e)} />
                  </td>
                  <td className="px-5 py-4">
                    {e.archivedInGmail ? (
                      <Badge className="border-slate-600/30 bg-slate-700/30 text-slate-400">Archived</Badge>
                    ) : e.reviewStatus === "confirmed" || e.reviewStatus === "corrected" ? (
                      <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Confirmed</Badge>
                    ) : (
                      <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">Pending</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(e.receivedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <Button className="text-xs">
                      Review <ChevronRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button className="hidden flex-1 cursor-default md:block" onClick={() => { setSelected(null); setCorrectingId(null); }} aria-label="Close" />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6">
              <StatusBadge status={displayClassification(selected)} />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                {selected.application?.jobPosting.companyName ?? selected.senderName ?? selected.senderEmail}
              </h2>
              {selected.application && (
                <p className="mt-1 text-sm text-slate-400">{selected.application.jobPosting.roleTitle}</p>
              )}
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
                <p className="mt-1 text-sm text-slate-200">{selected.subject}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Sender</p>
                <p className="mt-1 text-sm text-slate-200">{selected.senderEmail}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Received</p>
                <p className="mt-1 text-sm text-slate-200">
                  {new Date(selected.receivedAt).toLocaleString()}
                </p>
              </Card>

              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Classification</p>
                  <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                    {Math.round(selected.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-slate-300">{selected.reason}</p>
              </Card>

              <Card className="p-4">
                <p className="text-sm font-medium text-white">Snippet</p>
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                  {selected.snippet}
                </p>
              </Card>
            </div>

            {correctingId === selected.id ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-slate-400">Select the correct classification:</p>
                <div className="grid gap-2">
                  {CLASSIFICATIONS.map((c) => (
                    <Button
                      key={c}
                      disabled={busy === selected.id}
                      onClick={() => correct(selected.id, c)}
                      className="justify-start text-xs"
                    >
                      {c.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
                <Button onClick={() => setCorrectingId(null)} className="w-full text-xs">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {selected.reviewStatus === "pending" && (
                  <Button
                    onClick={() => confirm(selected.id)}
                    disabled={busy === selected.id}
                    className="bg-indigo-500 text-white hover:bg-indigo-400"
                  >
                    {busy === selected.id ? "…" : "Confirm"}
                  </Button>
                )}
                <Button
                  onClick={() => setCorrectingId(selected.id)}
                  disabled={busy === selected.id}
                >
                  Correct
                </Button>
                {!selected.archivedInGmail && selected.reviewStatus !== "pending" && (
                  <Button
                    onClick={() => archive(selected.id)}
                    disabled={busy === selected.id}
                    className="border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  >
                    {busy === selected.id ? "…" : "Archive"}
                  </Button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
