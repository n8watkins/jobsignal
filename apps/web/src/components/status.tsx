import { Badge } from "@/components/ui";
import { titleCase } from "@/lib/utils";

export function statusTone(status: string) {
  const tones: Record<string, string> = {
    interview_request: "border-violet-400/20 bg-violet-500/10 text-violet-300",
    interview_requested: "border-violet-400/20 bg-violet-500/10 text-violet-300",
    rejection: "border-rose-400/20 bg-rose-500/10 text-rose-300",
    rejected: "border-rose-400/20 bg-rose-500/10 text-rose-300",
    assessment_request: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    assessment_requested: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    application_confirmed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    applied: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
    manual_review: "border-slate-400/20 bg-slate-500/10 text-slate-300",
  };
  return tones[status] || "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={statusTone(status)}>{titleCase(status)}</Badge>;
}
