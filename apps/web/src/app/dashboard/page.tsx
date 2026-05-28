import Link from "next/link";
import { AlertTriangle, BarChart3, Briefcase, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { prisma } from "@/lib/prisma";
import { EmailSignalsSection } from "./email-signals-section";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

export const dynamic = "force-dynamic";

const icons = [Briefcase, BarChart3, CheckCircle2, AlertTriangle];

export default async function DashboardPage() {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });

  const applications = user
    ? await prisma.application.findMany({
        where: { userId: user.id },
        orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
        include: {
          jobPosting: {
            include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
        },
      })
    : [];

  const total = applications.length;
  const responded = applications.filter((a) => a.status !== "applied").length;
  const interviews = applications.filter((a) => a.status === "interview_requested").length;
  const assessments = applications.filter((a) => a.status === "assessment_requested").length;
  const needsActionCount = applications.filter((a) => a.actionNeeded).length;
  const responseRate = total > 0 ? ((responded / total) * 100).toFixed(1) : "0";

  const stats = [
    { label: "Applications Tracked", value: String(total), subtext: "Total captured applications" },
    { label: "Response Rate", value: `${responseRate}%`, subtext: `${responded} responses from ${total} applications` },
    { label: "Interview Requests", value: String(interviews), subtext: total > 0 ? `${((interviews / total) * 100).toFixed(1)}% conversion rate` : "No applications yet" },
    { label: "Needs Action", value: String(needsActionCount), subtext: `${needsActionCount} item${needsActionCount !== 1 ? "s" : ""} flagged for follow-up` },
  ];

  const funnel = [
    { stage: "Applied", count: total, percent: 100 },
    { stage: "Responses", count: responded, percent: total > 0 ? parseFloat(((responded / total) * 100).toFixed(1)) : 0 },
    { stage: "Interviews", count: interviews, percent: total > 0 ? parseFloat(((interviews / total) * 100).toFixed(1)) : 0 },
    { stage: "Assessments", count: assessments, percent: total > 0 ? parseFloat(((assessments / total) * 100).toFixed(1)) : 0 },
    { stage: "Offers", count: 0, percent: 0 },
  ];

  const needsActionItems = applications
    .filter((a) => a.nextAction && a.nextAction !== "None" && a.nextAction !== "Wait")
    .slice(0, 4);

  const currentDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

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
          <p className="mt-2 text-slate-400">Here's what changed in your job search inbox.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            Last scan: <span className="font-medium text-slate-200">Gmail not connected</span>
          </div>
          <Badge className="border-slate-400/20 bg-slate-500/10 px-3 py-2 text-slate-300">Gmail stub</Badge>
          <Button className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-200">
            <RefreshCw size={16} /> Scan Gmail
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
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
            {responded > 0 && total > 0 ? (
              <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">{responseRate}% response rate</Badge>
            ) : (
              <Badge className="border-white/10 bg-white/5 text-slate-400">No responses yet</Badge>
            )}
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
              <p className="mt-1 text-sm text-slate-400">Applications with a next action set</p>
            </div>
            <Clock className="text-slate-500" size={19} />
          </div>
          {needsActionItems.length === 0 ? (
            <p className="text-sm text-slate-500">No items need action yet.</p>
          ) : (
            <div className="space-y-3">
              {needsActionItems.map((app) => (
                <Link key={app.id} href={`/applications/${app.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{app.jobPosting.companyName}</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="truncate text-sm text-slate-400">{app.nextAction}</p>
                  </div>
                  <Button className="px-3 py-2 text-xs">Open</Button>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-4 space-y-4">
        <EmailSignalsSection />

        <Card className="overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-base font-semibold text-white">Application Pipeline</h2>
            <p className="mt-1 text-sm text-slate-400">Tracked companies and their latest known status.</p>
          </div>
          {applications.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No applications yet. <Link href="/applications/new" className="text-indigo-400 hover:underline">Add one manually</Link> or use the extension.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Fit</th>
                    <th className="px-5 py-3 font-medium">Pay</th>
                    <th className="px-5 py-3 font-medium">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {applications.map((app) => {
                    const analysis = app.jobPosting.analyses[0];
                    return (
                      <tr key={app.id} className="hover:bg-white/[0.04]">
                        <td className="px-5 py-4">
                          <Link href={`/applications/${app.id}`} className="font-medium text-white hover:underline">{app.jobPosting.companyName}</Link>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{app.jobPosting.roleTitle}</td>
                        <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                        <td className="px-5 py-4 text-slate-300">{analysis?.fitScore ?? "—"}</td>
                        <td className="px-5 py-4">
                          {app.jobPosting.salaryListed
                            ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Listed</Badge>
                            : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">Missing</Badge>}
                        </td>
                        <td className="px-5 py-4 text-slate-300">{app.nextAction || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </AppShell>
  );
}
