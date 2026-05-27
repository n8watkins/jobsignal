"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Briefcase, CheckCircle2, ChevronRight, Clock, RefreshCw, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { dashboardStats, mockApplications, mockEmailSignals } from "@/lib/mock-data";

const icons = [Briefcase, BarChart3, CheckCircle2, AlertTriangle];
const funnel = [
  { stage: "Applied", count: 84, percent: 100 },
  { stage: "Responses", count: 23, percent: 27.4 },
  { stage: "Interviews", count: 6, percent: 7.1 },
  { stage: "Assessments", count: 4, percent: 4.8 },
  { stage: "Offers", count: 0, percent: 0 },
];

export default function DashboardPage() {
  const [selectedEmail, setSelectedEmail] = useState<(typeof mockEmailSignals)[number] | null>(null);
  const currentDate = useMemo(() => new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()), []);

  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>{currentDate}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Dashboard</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Good morning, Nathan</h1>
          <p className="mt-2 text-slate-400">Here’s what changed in your job search inbox.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            Last scan: <span className="font-medium text-slate-200">14 minutes ago</span>
          </div>
          <Badge className="border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">Gmail connected</Badge>
          <Button className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-200">
            <RefreshCw size={16} /> Scan Gmail
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = icons[index];
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{stat.subtext}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 text-slate-300 ring-1 ring-white/10"><Icon size={20} /></div>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Job Search Funnel</h2>
              <p className="mt-1 text-sm text-slate-400">Applied → responded → interview → offer</p>
            </div>
            <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">27.4% response rate</Badge>
          </div>
          <div className="space-y-4">
            {funnel.map((item) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-200">{item.stage}</span>
                  <span className="text-slate-400">{item.count} · {item.percent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-800/80">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" style={{ width: `${Math.max(item.percent, item.count === 0 ? 1 : 6)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Needs Action</h2>
              <p className="mt-1 text-sm text-slate-400">High-priority items from Gmail and your pipeline</p>
            </div>
            <Clock className="text-slate-500" size={19} />
          </div>
          <div className="space-y-3">
            {mockApplications.filter((app) => app.nextAction !== "None" && app.nextAction !== "Wait").slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2"><p className="truncate text-sm font-medium text-white">{item.company}</p><StatusBadge status={item.status} /></div>
                  <p className="truncate text-sm text-slate-400">{item.nextAction}</p>
                </div>
                <Button className="px-3 py-2 text-xs">Open</Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-4 space-y-4">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Email Signals</h2>
              <p className="mt-1 text-sm text-slate-400">Latest job-related emails classified from Gmail.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 text-slate-500" size={16} /><input className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/50 sm:w-64" placeholder="Search companies or subjects…" /></div>
              <Button>All classifications</Button>
              <Button className="border-amber-400/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15">Needs action</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Company</th><th className="px-5 py-3 font-medium">Subject</th><th className="px-5 py-3 font-medium">Classification</th><th className="px-5 py-3 font-medium">Confidence</th><th className="px-5 py-3 font-medium">Received</th><th className="px-5 py-3 font-medium">Action</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {mockEmailSignals.map((email) => (
                  <tr key={email.id} onClick={() => setSelectedEmail(email)} className="cursor-pointer transition hover:bg-white/[0.04]">
                    <td className="px-5 py-4"><div className="font-medium text-white">{email.company}</div><div className="mt-1 text-xs text-slate-500">{email.role}</div></td>
                    <td className="max-w-[300px] px-5 py-4"><div className="truncate text-slate-200">{email.subject}</div><div className="mt-1 truncate text-xs text-slate-500">{email.sender}</div></td>
                    <td className="px-5 py-4"><StatusBadge status={email.classification} /></td>
                    <td className="px-5 py-4 text-slate-300">{email.confidence}%</td>
                    <td className="px-5 py-4 text-slate-400">{email.received}</td>
                    <td className="px-5 py-4"><Button className="text-xs">{email.action}<ChevronRight size={14} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-white/10 p-5"><h2 className="text-base font-semibold text-white">Application Pipeline</h2><p className="mt-1 text-sm text-slate-400">Tracked companies and their latest known status.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Company</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Fit</th><th className="px-5 py-3 font-medium">Pay</th><th className="px-5 py-3 font-medium">Next Action</th></tr></thead><tbody className="divide-y divide-white/10">{mockApplications.map((app) => <tr key={app.id} className="hover:bg-white/[0.04]"><td className="px-5 py-4 font-medium text-white">{app.company}</td><td className="px-5 py-4 text-slate-300">{app.role}</td><td className="px-5 py-4"><StatusBadge status={app.status} /></td><td className="px-5 py-4 text-slate-300">{app.fitScore}</td><td className="px-5 py-4">{app.payListed ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Listed</Badge> : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">Missing</Badge>}</td><td className="px-5 py-4 text-slate-300">{app.nextAction}</td></tr>)}</tbody></table></div>
        </Card>
      </section>

      {selectedEmail ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <button className="hidden flex-1 cursor-default md:block" onClick={() => setSelectedEmail(null)} aria-label="Close drawer" />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-6"><StatusBadge status={selectedEmail.classification} /><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{selectedEmail.company}</h2><p className="mt-1 text-sm text-slate-400">{selectedEmail.role}</p></div>
            <div className="space-y-4">
              <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Subject</p><p className="mt-1 text-sm text-slate-200">{selectedEmail.subject}</p><p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Sender</p><p className="mt-1 text-sm text-slate-200">{selectedEmail.sender}</p></Card>
              <Card className="p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-white">AI Classification</p><Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">{selectedEmail.confidence}% confidence</Badge></div><p className="text-sm leading-6 text-slate-300">{selectedEmail.reason}</p></Card>
              <Card className="p-4"><p className="text-sm font-medium text-white">Email Snippet</p><p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">{selectedEmail.snippet}</p></Card>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><Button className="bg-indigo-500 text-white hover:bg-indigo-400">Open in Gmail</Button><Button>Correct</Button><Button>Mark Done</Button></div>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}
