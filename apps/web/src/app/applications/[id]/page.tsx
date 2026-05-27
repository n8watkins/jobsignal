import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({
    where: { id: params.id },
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
      },
      emailEvents: {
        orderBy: { receivedAt: "desc" },
      },
    },
  });

  if (!app) notFound();

  const analysis = app.jobPosting.analyses[0];
  const requiredSkills = parseJsonArray(app.jobPosting.requiredSkills);
  const techStack = parseJsonArray(app.jobPosting.techStack);
  const redFlags = parseJsonArray(app.jobPosting.redFlags);
  const strongestMatches = parseJsonArray(analysis?.strongestMatches);
  const possibleGaps = parseJsonArray(analysis?.possibleGaps);
  const questionsToAsk = parseJsonArray(analysis?.questionsToAsk);

  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <StatusBadge status={app.status} />
            {app.jobPosting.salaryListed ? <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Pay listed</Badge> : <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">No pay listed</Badge>}
            {analysis ? <Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300">Fit {analysis.fitScore}</Badge> : null}
            {app.source ? <Badge className="border-white/10 bg-white/5 text-slate-300">{app.source}</Badge> : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{app.jobPosting.companyName} — {app.jobPosting.roleTitle}</h1>
          <p className="mt-2 text-slate-400">
            Applied {formatDate(app.appliedAt || app.createdAt)}. {app.nextAction ? `Next action: ${app.nextAction}` : "No next action set."}
          </p>
        </div>
        <div className="flex gap-2">
          {app.jobPosting.jobUrl ? (
            <Link href={app.jobPosting.jobUrl} target="_blank" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">Open Job</Link>
          ) : null}
          <Link href="/applications" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">Back</Link>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-white">AI Analysis</h2>
          {analysis ? (
            <div className="mt-4 space-y-5 text-sm leading-6 text-slate-300">
              <div className="grid gap-3 sm:grid-cols-3">
                <Score label="Fit" value={analysis.fitScore} />
                <Score label="Opportunity" value={analysis.opportunityScore} />
                <Score label="Comp clarity" value={analysis.compensationClarityScore} />
              </div>
              <p><strong className="text-white">Resume angle:</strong> {analysis.resumeAngle}</p>
              <p><strong className="text-white">Strategy:</strong> {analysis.applicationStrategy}</p>
              <List title="Strong matches" items={strongestMatches} />
              <List title="Possible gaps" items={possibleGaps} />
              <List title="Questions to ask" items={questionsToAsk} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No analysis has been generated yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Timeline</h2>
          <div className="mt-4 space-y-4">
            {app.events.length === 0 ? <p className="text-sm text-slate-400">No timeline events yet.</p> : null}
            {app.events.map((event) => (
              <TimelineItem key={event.id} title={event.title} body={event.description || event.type} date={event.occurredAt} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1fr]">
        <Card className="p-5">
          <h2 className="font-semibold text-white">Job Details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Detail label="Company" value={app.jobPosting.companyName} />
            <Detail label="Role" value={app.jobPosting.roleTitle} />
            <Detail label="Location" value={app.jobPosting.location || "Unknown"} />
            <Detail label="Workplace" value={app.jobPosting.workplaceType} />
            <Detail label="Employment" value={app.jobPosting.employmentType} />
            <Detail label="Salary" value={app.jobPosting.salaryText || (app.jobPosting.salaryListed ? "Listed" : "Not listed")} />
          </dl>
          <div className="mt-5 space-y-4">
            <List title="Tech stack" items={techStack} />
            <List title="Required skills" items={requiredSkills} />
            <List title="Red flags" items={redFlags} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Job Description</h2>
          <p className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300 whitespace-pre-wrap">
            {app.jobPosting.rawDescription || "No captured job description."}
          </p>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-semibold text-white">Email Signals</h2>
          <p className="mt-1 text-sm text-slate-400">Gmail-linked events will appear here once Gmail scanning is wired.</p>
        </div>
        <div className="divide-y divide-white/10">
          {app.emailEvents.length === 0 ? <p className="p-5 text-sm text-slate-400">No linked emails yet.</p> : null}
          {app.emailEvents.map((email) => (
            <div key={email.id} className="p-5 text-sm">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={email.classification} /><span className="text-slate-400">{formatDate(email.receivedAt)}</span></div>
              <p className="mt-2 font-medium text-white">{email.subject}</p>
              <p className="mt-1 text-slate-400">{email.snippet}</p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3"><dt className="text-slate-500">{label}</dt><dd className="text-right text-slate-200">{value}</dd></div>;
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <div><p className="text-xs uppercase tracking-wide text-slate-500">{title}</p><div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} className="border-white/10 bg-white/5 text-slate-300">{item}</Badge>)}</div></div>;
}

function TimelineItem({ title, body, date }: { title: string; body: string; date: Date }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="font-medium text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{body}</p><p className="mt-2 text-xs text-slate-600">{formatDate(date)}</p></div>;
}

function parseJsonArray(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
