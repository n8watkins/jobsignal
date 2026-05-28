"use client";

import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { mockEmailSignals } from "@/lib/mock-data";

export function EmailSignalsSection() {
  const [selectedEmail, setSelectedEmail] = useState<(typeof mockEmailSignals)[number] | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Email Signals</h2>
            <p className="mt-1 text-sm text-slate-400">Latest job-related emails classified from Gmail.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-500" size={16} />
              <input className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/50 sm:w-64" placeholder="Search companies or subjects…" />
            </div>
            <Button>All classifications</Button>
            <Button className="border-amber-400/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15">Needs action</Button>
          </div>
        </div>
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
              {mockEmailSignals.map((email) => (
                <tr key={email.id} onClick={() => setSelectedEmail(email)} className="cursor-pointer transition hover:bg-white/[0.04]">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{email.company}</div>
                    <div className="mt-1 text-xs text-slate-500">{email.role}</div>
                  </td>
                  <td className="max-w-[300px] px-5 py-4">
                    <div className="truncate text-slate-200">{email.subject}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{email.sender}</div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={email.classification} /></td>
                  <td className="px-5 py-4 text-slate-300">{email.confidence}%</td>
                  <td className="px-5 py-4 text-slate-400">{email.received}</td>
                  <td className="px-5 py-4">
                    <Button className="text-xs">{email.action}<ChevronRight size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEmail ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button className="hidden flex-1 cursor-default md:block" onClick={() => setSelectedEmail(null)} aria-label="Close drawer" />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6">
              <StatusBadge status={selectedEmail.classification} />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{selectedEmail.company}</h2>
              <p className="mt-1 text-sm text-slate-400">{selectedEmail.role}</p>
            </div>
            <div className="space-y-4">
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
                <p className="mt-1 text-sm text-slate-200">{selectedEmail.subject}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Sender</p>
                <p className="mt-1 text-sm text-slate-200">{selectedEmail.sender}</p>
              </Card>
              <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">AI Classification</p>
                  <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">{selectedEmail.confidence}% confidence</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-300">{selectedEmail.reason}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-medium text-white">Email Snippet</p>
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">{selectedEmail.snippet}</p>
              </Card>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button className="bg-indigo-500 text-white hover:bg-indigo-400">Open in Gmail</Button>
              <Button>Correct</Button>
              <Button>Mark Done</Button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
