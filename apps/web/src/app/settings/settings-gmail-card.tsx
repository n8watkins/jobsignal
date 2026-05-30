"use client";

import { Badge, Button } from "@/components/ui";

export function SettingsGmailCard({
  connected,
  googleEmail,
  gmailError,
  gmailSuccess,
}: {
  connected: boolean;
  googleEmail: string | null;
  gmailError: boolean;
  gmailSuccess: boolean;
}) {
  return (
    <div>
      <div className="mt-3 flex items-center gap-3">
        {connected ? (
          <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Connected</Badge>
        ) : (
          <Badge className="border-amber-400/20 bg-amber-500/10 text-amber-300">Not connected</Badge>
        )}
        {googleEmail && <span className="text-sm text-slate-400">{googleEmail}</span>}
      </div>

      {gmailError && (
        <p className="mt-3 text-sm text-rose-400">Connection failed. Check your Google OAuth credentials and try again.</p>
      )}
      {gmailSuccess && (
        <p className="mt-3 text-sm text-emerald-400">Gmail connected successfully.</p>
      )}

      <p className="mt-3 text-sm text-slate-400">
        {connected
          ? "Gmail is connected. JobSignal can scan your inbox for recruiting signals."
          : "Connect Gmail to scan your inbox for interview requests, rejections, and assessments."}
      </p>

      <a href="/api/auth/google">
        <Button className="mt-4">
          {connected ? "Reconnect Gmail" : "Connect Gmail"}
        </Button>
      </a>
    </div>
  );
}
