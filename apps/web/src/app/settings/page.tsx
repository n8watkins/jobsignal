import { AppShell } from "@/components/app-shell";
import { Card, Input, Button, Badge } from "@/components/ui";

export default function SettingsPage() {
  return (
    <AppShell>
      <header className="mb-6"><h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1><p className="mt-2 text-slate-400">Personal beta settings and integration status.</p></header>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5"><h2 className="font-semibold text-white">Access</h2><p className="mt-2 text-sm text-slate-400">Single-user allowlist.</p><label className="mt-4 block text-sm text-slate-300">Allowed Email<Input className="mt-2" defaultValue="nathancwatkins23@gmail.com" /></label><Button className="mt-4">Save</Button></Card>
        <Card className="p-5"><h2 className="font-semibold text-white">Gmail</h2><div className="mt-3"><Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">Not wired</Badge></div><p className="mt-3 text-sm text-slate-400">Add Google OAuth credentials, then wire scan/archive endpoints.</p><Button className="mt-4">Connect Gmail</Button></Card>
        <Card className="p-5"><h2 className="font-semibold text-white">Resume Versions</h2><p className="mt-2 text-sm text-slate-400">These populate the extension dropdown.</p><label className="mt-4 block text-sm text-slate-300">Default Resume Name<Input className="mt-2" defaultValue="Frontend Resume v3" /></label><Button className="mt-4">Add Resume</Button></Card>
        <Card className="p-5"><h2 className="font-semibold text-white">AI</h2><p className="mt-2 text-sm text-slate-400">Current AI calls are deterministic stubs. Replace service functions with Gemini/OpenAI calls.</p><Button className="mt-4">Test Analysis</Button></Card>
      </div>
    </AppShell>
  );
}
