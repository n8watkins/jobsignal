import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { ResumeVersionsManager } from "./resume-versions-manager";
import { SettingsGmailCard } from "./settings-gmail-card";
import { SettingsTestAnalysis } from "./settings-test-analysis";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const { gmail } = await searchParams;
  const user = await getCurrentUser();

  const gmailConnected = Boolean(user.googleRefreshToken);

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-2 text-slate-400">Personal beta settings and integration status.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-white">Access</h2>
          <p className="mt-2 text-sm text-slate-400">Single-user allowlist.</p>
          <p className="mt-4 text-sm text-slate-300">
            Logged in as <span className="font-medium text-white">{user.email}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Set <code className="text-slate-400">SINGLE_USER_EMAIL</code> in{" "}
            <code className="text-slate-400">.env.local</code> to change.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Gmail</h2>
          <SettingsGmailCard
            connected={gmailConnected}
            googleEmail={user.googleEmail ?? null}
            gmailError={gmail === "error"}
            gmailSuccess={gmail === "connected"}
          />
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">Resume Versions</h2>
          <ResumeVersionsManager />
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-white">AI Analysis</h2>
          <SettingsTestAnalysis />
        </Card>
      </div>
    </AppShell>
  );
}
