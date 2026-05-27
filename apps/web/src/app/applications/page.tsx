import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { mockApplications } from "@/lib/mock-data";

const columns = [
  { key: "applied", label: "Applied" },
  { key: "application_confirmed", label: "Confirmed" },
  { key: "interview_requested", label: "Interview" },
  { key: "assessment_requested", label: "Assessment" },
  { key: "rejected", label: "Rejected" },
];

export default function ApplicationsPage() {
  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Applications</h1>
          <p className="mt-2 text-slate-400">Pipeline, Kanban, and tracked job intelligence.</p>
        </div>
        <Link href="/applications/new"><Button className="bg-white text-slate-950 hover:bg-slate-200">New Application</Button></Link>
      </header>

      <section className="grid gap-4 overflow-x-auto xl:grid-cols-5">
        {columns.map((column) => (
          <Card key={column.key} className="min-h-80 p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-white">{column.label}</h2><Badge className="border-white/10 bg-white/5 text-slate-300">{mockApplications.filter((app) => app.status === column.key).length}</Badge></div>
            <div className="space-y-3">
              {mockApplications.filter((app) => app.status === column.key).map((app) => (
                <Link key={app.id} href={`/applications/${app.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                  <p className="font-medium text-white">{app.company}</p>
                  <p className="mt-1 text-sm text-slate-400">{app.role}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300">Fit {app.fitScore}</Badge>{app.payListed ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Pay listed</Badge> : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">No pay</Badge>}</div>
                  <p className="mt-3 text-xs text-slate-500">{app.nextAction}</p>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-white/10 p-5"><h2 className="text-base font-semibold text-white">Table View</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Company</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Source</th><th className="px-5 py-3 font-medium">Fit</th><th className="px-5 py-3 font-medium">Pay</th></tr></thead><tbody className="divide-y divide-white/10">{mockApplications.map((app) => <tr key={app.id} className="hover:bg-white/[0.04]"><td className="px-5 py-4"><Link className="font-medium text-white hover:underline" href={`/applications/${app.id}`}>{app.company}</Link></td><td className="px-5 py-4 text-slate-300">{app.role}</td><td className="px-5 py-4"><StatusBadge status={app.status} /></td><td className="px-5 py-4 text-slate-400">{app.source}</td><td className="px-5 py-4 text-slate-300">{app.fitScore}</td><td className="px-5 py-4">{app.payListed ? "Listed" : "Missing"}</td></tr>)}</tbody></table></div>
      </Card>
    </AppShell>
  );
}
