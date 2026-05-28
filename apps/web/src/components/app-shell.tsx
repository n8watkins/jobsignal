import Link from "next/link";
import { Briefcase, CheckCircle2, Inbox, LayoutDashboard, Mail, Radar, Search, Settings, Sparkles, UserCircle } from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Job Radar", href: "/candidate-jobs", icon: Radar },
  { label: "Applications", href: "/applications", icon: Briefcase },
  { label: "Research", href: "/research", icon: Search },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Inbox", href: "/inbox", icon: Mail },
  { label: "Review Queue", href: "/review", icon: Inbox, count: 3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-100">
      <div className="flex">
        <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-slate-950/80 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">JobSignal</h1>
              <p className="text-xs text-slate-400">Job-search command center</p>
            </div>
          </div>

          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    {item.label}
                  </span>
                  {item.count ? <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">{item.count}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-200">
              <CheckCircle2 size={16} /> Personal beta
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Single-user tracker. Job Radar and research queue are designed to enrich applications without blocking the core workflow.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
