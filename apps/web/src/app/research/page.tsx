import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getResearchBudgetSnapshot } from "@/lib/research/budget";
import { getResearchQueue } from "@/lib/research/queue";
import { QueueAppliedResearchButton, RunGeminiTaskButton, RunPlaceholderTaskButton } from "./research-actions";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const budget = await getResearchBudgetSnapshot();
  const tasks = await getResearchQueue(100);
  const profiles = await prisma.companyProfile.findMany({ orderBy: [{ updatedAt: "desc" }], take: 20 });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">JobSignal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Research Queue</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">Budget-aware company research for companies you applied to. Placeholder research lets us test queue, budget, and profile quality before turning Gemini Search on.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/applications" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Applications</Link>
            <QueueAppliedResearchButton />
          </div>
        </div>

        <section className="mb-6 grid gap-3 md:grid-cols-4">
          <BudgetCard title="Total Search" used={budget.total.used} limit={budget.total.limit} />
          <BudgetCard title="Baseline" used={budget.baseline.used} limit={budget.baseline.limit} />
          <BudgetCard title="Follow-up" used={budget.followup.used} limit={budget.followup.limit} />
          <BudgetCard title="Interview / Manual" used={budget.interviewManual.used} limit={budget.interviewManual.limit} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <Card>
            <div className="border-b border-white/10 p-5"><h2 className="font-semibold text-white">Queue</h2><p className="mt-1 text-sm text-slate-400">{tasks.length} queued/deferred/failed tasks</p></div>
            <div className="divide-y divide-white/10">
              {tasks.length === 0 ? <div className="p-6 text-sm text-slate-500">No research tasks queued.</div> : tasks.map((task, index) => (
                <div key={task.id} className="grid gap-4 p-5 md:grid-cols-[56px_1fr_160px]">
                  <div className="text-2xl font-semibold text-slate-600">#{index + 1}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-white/10 bg-white/5 text-slate-300">{task.status}</Badge>
                      <Badge className="border-white/10 bg-white/5 text-slate-300">{task.budgetCategory}</Badge>
                      <Badge className="border-white/10 bg-white/5 text-slate-300">{task.searchCostEstimate} searches</Badge>
                      <Badge className="border-white/10 bg-white/5 text-slate-300">priority {task.priority}</Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-white">{task.companyName}</h3>
                    <p className="mt-1 text-sm text-slate-400">{task.taskType}</p>
                    {task.reason ? <p className="mt-2 text-sm text-slate-500">{task.reason}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <RunPlaceholderTaskButton id={task.id} />
                    <RunGeminiTaskButton id={task.id} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5"><h2 className="font-semibold text-white">Budget Snapshot</h2><div className="mt-4 space-y-3 text-sm"><Meta label="Search enabled" value={budget.searchEnabled ? "Yes" : "No"} /><Meta label="Queued tasks" value={String(budget.queued)} /><Meta label="Date key" value={budget.dateKey} /><Meta label="Model" value={budget.model} /></div></Card>
            <Card className="p-5"><h2 className="font-semibold text-white">Company Profiles</h2><div className="mt-4 space-y-3">{profiles.length === 0 ? <p className="text-sm text-slate-500">No company profiles yet.</p> : profiles.map((profile) => <div key={profile.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-white">{profile.companyName}</p><p className="mt-1 text-xs text-slate-500">{profile.researchStatus}</p></div><Score value={profile.profileCompletenessScore ?? 0} /></div>{profile.summary ? <p className="mt-3 text-sm text-slate-400">{profile.summary}</p> : null}<TinyList label="Missing" value={profile.missingFields} /></div>)}</div></Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function BudgetCard({ title, used, limit }: { title: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return <Card className="p-4"><p className="text-xs text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold text-white">{used} <span className="text-sm text-slate-500">/ {limit}</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-indigo-400" style={{ width: `${percent}%` }} /></div></Card>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0"><span className="text-slate-500">{label}</span><span className="text-right text-slate-300">{value}</span></div>; }
function Score({ value }: { value: number }) { const className = value >= 80 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : value >= 55 ? "border-amber-400/20 bg-amber-500/10 text-amber-300" : "border-rose-400/20 bg-rose-500/10 text-rose-300"; return <Badge className={className}>{value}%</Badge>; }
function TinyList({ label, value }: { label: string; value: string }) { const items = parseList(value); if (items.length === 0) return null; return <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p><div className="mt-2 flex flex-wrap gap-1.5">{items.slice(0, 5).map((item) => <Badge key={item} className="border-white/10 bg-white/5 text-slate-400">{item}</Badge>)}</div></div>; }
function parseList(value: string | null | undefined): string[] { if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Boolean) : []; } catch { return []; } }
