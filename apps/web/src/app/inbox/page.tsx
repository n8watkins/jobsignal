import { AppShell } from "@/components/app-shell";
import { Card, Button } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { mockEmailSignals } from "@/lib/mock-data";

export default function InboxPage() {
  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between"><div><h1 className="text-3xl font-semibold tracking-tight text-white">Inbox Signals</h1><p className="mt-2 text-slate-400">Classified recruiting emails. Gmail API is stubbed for now.</p></div><Button className="bg-white text-slate-950 hover:bg-slate-200">Scan Gmail</Button></header>
      <Card className="overflow-hidden"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.02] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Company</th><th className="px-5 py-3">Subject</th><th className="px-5 py-3">Classification</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-white/10">{mockEmailSignals.map((email) => <tr key={email.id}><td className="px-5 py-4 text-white">{email.company}</td><td className="px-5 py-4 text-slate-300">{email.subject}</td><td className="px-5 py-4"><StatusBadge status={email.classification} /></td><td className="px-5 py-4"><Button>{email.action}</Button></td></tr>)}</tbody></table></Card>
    </AppShell>
  );
}
