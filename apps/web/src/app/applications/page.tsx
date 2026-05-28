import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

const columns = [
  { key: "applied", label: "Applied" },
  { key: "application_confirmed", label: "Confirmed" },
  { key: "interview_requested", label: "Interview" },
  { key: "assessment_requested", label: "Assessment" },
  { key: "rejected", label: "Rejected" },
];

export default async function ApplicationsPage() {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
  const applications = user ? await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
    include: {
      jobPosting: {
        include: {
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      events: {
        orderBy: { occurredAt: "desc" },
        take: 1,
      },
    },
  }) : [];

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Applications</h1>
          <p className="mt-2 text-slate-400">Pipeline, Kanban, and tracked job intelligence.</p>
        </div>
        <Link href="/applications/new"><Button className="bg-white text-slate-950 hover:bg-slate-200">New Application</Button></Link>
      </header>

      {applications.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Open a LinkedIn job page, apply manually, then use the JobSignal extension to mark it applied. Captured jobs will appear here.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-slate-300">
            <p className="font-medium text-white">First test flow</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-400">
              <li>Run the web app on localhost.</li>
              <li>Build and load the Chrome extension.</li>
              <li>Open a LinkedIn job page and press Ctrl+Shift+A.</li>
              <li>Confirm Applied in the popup.</li>
            </ol>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 overflow-x-auto xl:grid-cols-5">
            {columns.map((column) => {
              const items = applications.filter((app) => app.status === column.key);
              return (
                <Card key={column.key} className="min-h-80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-white">{column.label}</h2>
                    <Badge className="border-white/10 bg-white/5 text-slate-300">{items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No cards yet</div>
                    ) : null}
                    {items.map((app) => {
                      const analysis = app.jobPosting.analyses[0];
                      return (
                        <Link key={app.id} href={`/applications/${app.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                          <p className="font-medium text-white">{app.jobPosting.companyName}</p>
                          <p className="mt-1 text-sm text-slate-400">{app.jobPosting.roleTitle}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {analysis ? <Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300">Fit {analysis.fitScore}</Badge> : null}
                            {app.jobPosting.salaryListed ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Pay listed</Badge> : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">No pay</Badge>}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">{app.nextAction || app.events[0]?.title || "No next action"}</p>
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </section>

          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-base font-semibold text-white">Table View</h2>
              <p className="mt-1 text-sm text-slate-400">Every application captured from LinkedIn or added later.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Source</th>
                    <th className="px-5 py-3 font-medium">Applied</th>
                    <th className="px-5 py-3 font-medium">Fit</th>
                    <th className="px-5 py-3 font-medium">Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {applications.map((app) => {
                    const analysis = app.jobPosting.analyses[0];
                    return (
                      <tr key={app.id} className="hover:bg-white/[0.04]">
                        <td className="px-5 py-4"><Link className="font-medium text-white hover:underline" href={`/applications/${app.id}`}>{app.jobPosting.companyName}</Link></td>
                        <td className="px-5 py-4 text-slate-300">{app.jobPosting.roleTitle}</td>
                        <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                        <td className="px-5 py-4 text-slate-400">{app.source || app.jobPosting.source || "Unknown"}</td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(app.appliedAt || app.createdAt)}</td>
                        <td className="px-5 py-4 text-slate-300">{analysis?.fitScore ?? "—"}</td>
                        <td className="px-5 py-4">{app.jobPosting.salaryListed ? "Listed" : "Missing"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
