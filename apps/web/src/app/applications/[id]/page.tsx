import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { mockApplications } from "@/lib/mock-data";

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const app = mockApplications.find((item) => item.id === params.id) || mockApplications[0];
  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2"><StatusBadge status={app.status} />{app.payListed ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Pay listed</Badge> : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">No pay listed</Badge>}<Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300">Fit {app.fitScore}</Badge></div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{app.company} — {app.role}</h1>
          <p className="mt-2 text-slate-400">Source: {app.source}. Next action: {app.nextAction}</p>
        </div>
      </header>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card className="p-5"><h2 className="font-semibold text-white">AI Analysis</h2><div className="mt-4 space-y-4 text-sm leading-6 text-slate-300"><p><strong className="text-white">Resume angle:</strong> Lead with dashboard UI, API integration, AI automation, and React/Next.js project work.</p><p><strong className="text-white">Concerns:</strong> Missing compensation. Confirm backend expectations.</p><p><strong className="text-white">Questions to ask:</strong> What is the salary range? What does the frontend/backend split look like?</p></div></Card>
        <Card className="p-5"><h2 className="font-semibold text-white">Timeline</h2><div className="mt-4 space-y-4"><TimelineItem title="Applied" body="Created from Chrome extension Mark Applied flow." /><TimelineItem title="Job analysis queued" body="JD extraction, missing pay detection, and fit score generated." /><TimelineItem title="Latest signal" body={app.nextAction} /></div></Card>
      </div>
      <Card className="mt-4 p-5"><h2 className="font-semibold text-white">Job Description</h2><p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">This is a placeholder. The captured JD from the extension or manual form will render here.</p></Card>
    </AppShell>
  );
}

function TimelineItem({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{body}</p></div>;
}
