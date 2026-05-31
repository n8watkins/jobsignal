"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";

type FollowUpApp = {
  id: string;
  status: string;
  lastContactAt: Date | null;
  appliedAt: Date | null;
  jobPosting: { companyName: string; roleTitle: string };
};

function staleDays(app: FollowUpApp) {
  const ref = app.lastContactAt ?? app.appliedAt;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
}

export function FollowUpSection({ apps }: { apps: FollowUpApp[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (apps.length === 0) return null;

  async function markFollowedUp(id: string) {
    setBusy(id);
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastContactAt: new Date().toISOString() }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-400" />
            <h2 className="text-base font-semibold text-white">Follow-up Reminders</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {apps.length} application{apps.length !== 1 ? "s" : ""} with no contact in 7+ days
          </p>
        </div>
      </div>
      <div className="divide-y divide-white/10">
        {apps.map((app) => {
          const days = staleDays(app);
          return (
            <div key={app.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Link href={`/applications/${app.id}`} className="font-medium text-white hover:underline">
                    {app.jobPosting.companyName}
                  </Link>
                  <StatusBadge status={app.status} />
                </div>
                <p className="truncate text-sm text-slate-400">{app.jobPosting.roleTitle}</p>
                <p className="mt-0.5 text-xs text-amber-400/80">{days} days since last contact</p>
              </div>
              <Button
                onClick={() => markFollowedUp(app.id)}
                disabled={busy === app.id}
                className="shrink-0 text-xs"
              >
                {busy === app.id ? "Saving…" : "Followed up"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
