import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { CandidateJobActions } from "./candidate-job-actions";

export const dynamic = "force-dynamic";

export default async function CandidateJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.candidateJob.findUnique({
    where: { id },
    include: { application: true, analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!job) notFound();

  const analysis = job.analyses[0];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/candidate-jobs" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Back to Job Radar</Link>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <ScoreBadge score={job.fitScore || 0} label={job.scoreLabel || "Unscored"} />
              <Badge className="border-white/10 bg-white/5 text-slate-300">{job.status}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-300">{job.source}</Badge>
              {job.application ? <Badge className="border-indigo-400/20 bg-indigo-500/10 text-indigo-300">Linked to application</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{job.companyName}</h1>
            <p className="mt-2 text-lg text-slate-300">{job.roleTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-400">
              {job.location ? <span>{job.location}</span> : null}
              {job.workArrangement ? <span>· {job.workArrangement}</span> : null}
              {job.employmentType ? <span>· {job.employmentType}</span> : null}
              {job.salaryText ? <span>· {job.salaryText}</span> : <span>· No pay visible</span>}
            </div>
          </div>
          {job.application ? <Link href={`/applications/${job.application.id}`} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">Open Application</Link> : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-white">Score Breakdown</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <ReasonList title="Reasons" items={parseList(job.scoreReasons)} />
                <ReasonList title="Risks" items={parseList(job.riskFlags)} danger />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-white">Detected Technologies</h2>
              <ReasonList title="Required / detected" items={parseList(job.requiredTechnologies)} />
              <div className="mt-4"><ReasonList title="Emphasis areas" items={parseList(job.emphasisAreas)} /></div>
            </Card>
            {analysis ? (
              <Card className="p-5">
                <h2 className="mb-4 font-semibold text-white">Latest Analysis</h2>
                {analysis.summary ? <p className="text-sm text-slate-300">{analysis.summary}</p> : null}
                {analysis.resumePositioning ? <p className="mt-3 text-sm text-slate-400">{analysis.resumePositioning}</p> : null}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <ReasonList title="Likely day-to-day" items={parseList(analysis.likelyDayToDay)} />
                  <ReasonList title="Missing technologies" items={parseList(analysis.missingTechnologies)} danger />
                </div>
              </Card>
            ) : null}
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-white">Raw Description / Notes</h2>
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-sm leading-6 text-slate-300">{job.rawDescription || job.rawCardText || "No raw description captured yet."}</pre>
            </Card>
          </section>
          <aside className="space-y-5">
            <CandidateJobActions id={job.id} jobUrl={job.jobUrl} />
            <Card className="p-5">
              <h2 className="mb-4 font-semibold text-white">Job Metadata</h2>
              <dl className="space-y-3 text-sm">
                <Meta label="Source ID" value={job.sourceJobId || "—"} />
                <Meta label="Salary listed" value={job.salaryListed ? "Yes" : "No"} />
                <Meta label="Created" value={job.createdAt.toLocaleString()} />
                <Meta label="Updated" value={job.updatedAt.toLocaleString()} />
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"><dt className="text-slate-500">{label}</dt><dd className="text-right text-slate-300">{value}</dd></div>;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const className = score >= 85 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : score >= 70 ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300" : score >= 40 ? "border-amber-400/20 bg-amber-500/10 text-amber-300" : "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return <Badge className={className}>{score} · {label}</Badge>;
}

function ReasonList({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">No {title.toLowerCase()} captured yet.</p>;
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} className={danger ? "border-rose-400/20 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"}>{item}</Badge>)}</div></div>;
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean) : []; } catch { return []; }
}
