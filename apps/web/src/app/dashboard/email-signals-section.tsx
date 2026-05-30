"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
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
  actionNeeded: boolean;
  suggestedNextAction: string | null;
  application: {
    id: string;
    jobPosting: { companyName: string; roleTitle: string };
  } | null;
};

export function EmailSignalsSection({ events }: { events: EmailEvent[] }) {
  const [selectedEmail, setSelectedEmail] = useState<EmailEvent | null>(null);

  const displayClassification = (e: EmailEvent) => e.correctedClassification ?? e.classification;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Email Signals</h2>
            <p className="mt-1 text-sm text-slate-400">Pending recruiting signals from Gmail.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/inbox">
              <Button>View all</Button>
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No pending signals — scan Gmail from the{" "}
            <Link href="/inbox" className="text-indigo-400 underline">Inbox</Link> page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Classification</th>
                  <th className="px-5 py-3 font-medium">Confidence</th>
                  <th className="px-5 py-3 font-medium">Received</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className="cursor-pointer transition hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">
                        {email.application?.jobPosting.companyName ?? email.senderName ?? email.senderEmail}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {email.application?.jobPosting.roleTitle ?? email.senderEmail}
                      </div>
                    </td>
                    <td className="max-w-[300px] px-5 py-4">
                      <div className="truncate text-slate-200">{email.subject}</div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={displayClassification(email)} />
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {Math.round(email.confidence * 100)}%
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(email.receivedAt).toLocaleDateString()}
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
      </Card>

      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button
            className="hidden flex-1 cursor-default md:block"
            onClick={() => setSelectedEmail(null)}
            aria-label="Close drawer"
          />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6">
              <StatusBadge status={displayClassification(selectedEmail)} />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                {selectedEmail.application?.jobPosting.companyName ?? selectedEmail.senderName ?? selectedEmail.senderEmail}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {selectedEmail.application?.jobPosting.roleTitle}
              </p>
            </div>
            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
                <p className="mt-1 text-sm text-slate-200">{selectedEmail.subject}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Sender</p>
                <p className="mt-1 text-sm text-slate-200">{selectedEmail.senderEmail}</p>
              </Card>
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Classification</p>
                  <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                    {Math.round(selectedEmail.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-slate-300">{selectedEmail.reason}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-medium text-white">Snippet</p>
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                  {selectedEmail.snippet}
                </p>
              </Card>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/inbox">
                <Button className="w-full bg-indigo-500 text-white hover:bg-indigo-400">
                  Open in Inbox
                </Button>
              </Link>
              {selectedEmail.application && (
                <Link href={`/applications/${selectedEmail.application.id}`}>
                  <Button className="w-full">View Application</Button>
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
