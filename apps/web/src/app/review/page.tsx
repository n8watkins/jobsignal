import { AppShell } from "@/components/app-shell";
import { Card, Button } from "@/components/ui";
import { StatusBadge } from "@/components/status";

const reviewItems = [
  { id: "1", company: "Linear", subject: "Following up", guess: "manual_review", confidence: 62 },
  { id: "2", company: "Unknown", subject: "Application update", guess: "manual_review", confidence: 58 },
];

export default function ReviewPage() {
  return (
    <AppShell>
      <header className="mb-6"><h1 className="text-3xl font-semibold tracking-tight text-white">Manual Review</h1><p className="mt-2 text-slate-400">Low-confidence AI decisions land here before they change your pipeline.</p></header>
      <Card className="overflow-hidden"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Company</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">AI Guess</th><th className="px-5 py-3">Confidence</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-white/10">{reviewItems.map((item) => <tr key={item.id}><td className="px-5 py-4 text-white">{item.company}</td><td className="px-5 py-4 text-slate-300">{item.subject}</td><td className="px-5 py-4"><StatusBadge status={item.guess} /></td><td className="px-5 py-4 text-slate-300">{item.confidence}%</td><td className="px-5 py-4"><Button>Review</Button></td></tr>)}</tbody></table></Card>
    </AppShell>
  );
}
