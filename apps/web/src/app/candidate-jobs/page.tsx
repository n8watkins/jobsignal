import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

export const dynamic = "force-dynamic";

export default async function CandidateJobsPage() {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
  const candidateJobs = user
    ? await prisma.candidateJob.findMany({ where: { userId: user.id }, orderBy: [{ fitScore: "desc" }, { createdAt: "desc" }] })
    : [];

  const strongCount = candidateJobs.filter((job) => (job.fitScore || 0) >= 85).length;
  const goodCount = candidateJobs.filter((job) => (job.fitScore || 0) >= 70 && (job.fitScore || 0) < 85).length;
  const maybeCount = candidateJobs.filter((job) => (job.fitScore || 0) >= 40 && (job.fitScore || 0) < 70).length;

  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Job Radar</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Sourced jobs scored before they become applications. Applications stay separate until you actually apply.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/candidate-jobs/new"><Button className="bg-indigo-500 text-white hover:bg-indigo-400">Add Candidate Job</Button></Link>
          <Link href="/applications"><Button>View Applications</Button></Link>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total sourced" value={candidateJobs.length} />
        <Stat label="Strong" value={strongCount} />
        <Stat label="Good" value={goodCount} />
        <Stat label="Maybe" value={maybeCount} />
      </section>

      <section className="grid gap-4">
        {candidateJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white">No candidate jobs yet</h2>
            <p className="mt-2 text-sm text-slate-400">Add one manually or save from the extension once the LinkedIn overlay is loaded.</p>
          </Card>
        ) : (
          candidateJobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreBadge score={job.fitScore || 0} label={job.scoreLabel || "Unscored"} />
                    <Badge className="border-white/10 bg-white/5 text-slate-300">{job.status}</Badge>
                    <Badge className="border-white/10 bg-white/5 text-slate-300">{job.source}</Badge>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">{job.companyName}</h2>
                  <p className="mt-1 text-sm text-slate-300">{job.roleTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    {job.location ? <span>{job.location}</span> : null}
                    {job.workArrangement ? <span>· {job.workArrangement}</span> : null}
                    {job.employmentType ? <span>· {job.employmentType}</span> : null}
                    {job.salaryText ? <span>· {job.salaryText}</span> : <span>· No pay visible</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/candidate-jobs/${job.id}`}><Button className="bg-indigo-500 text-white hover:bg-indigo-400">Review</Button></Link>
                  {job.jobUrl ? <a href={job.jobUrl} target="_blank" rel="noreferrer"><Button>Open job</Button></a> : null}
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ReasonList title="Reasons" items={parseList(job.scoreReasons)} />
                <ReasonList title="Risks" items={parseList(job.riskFlags)} danger />
              </div>
              <div className="mt-4"><ReasonList title="Detected technologies" items={parseList(job.requiredTechnologies)} /></div>
            </Card>
          ))
        )}
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <Card className="p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></Card>;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const className = score >= 85 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : score >= 70 ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300" : score >= 40 ? "border-amber-400/20 bg-amber-500/10 text-amber-300" : "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return <Badge className={className}>{score} · {label}</Badge>;
}

function ReasonList({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  if (items.length === 0) return null;
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} className={danger ? "border-rose-400/20 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"}>{item}</Badge>)}</div></div>;
}

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean) : []; } catch { return []; }
}
