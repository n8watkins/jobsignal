"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button, Card } from "@/components/ui";

export function ConfirmRejectionBanner({
  applicationId,
  emailEventId,
  companyName,
  subject,
  gmailConnected,
}: {
  applicationId: string;
  emailEventId: string;
  companyName: string;
  subject: string;
  gmailConnected: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function confirmAndArchive() {
    setState("busy");
    try {
      const confirmRes = await fetch(`/api/gmail/email-events/${emailEventId}/confirm`, {
        method: "POST",
      });
      if (!confirmRes.ok) throw new Error("Confirm failed");

      if (gmailConnected) {
        await fetch(`/api/gmail/email-events/${emailEventId}/archive`, { method: "POST" });
      }

      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done") return null;

  return (
    <Card className="border-rose-400/20 bg-rose-500/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
        <div className="flex-1">
          <p className="font-medium text-white">Rejection email detected</p>
          <p className="mt-1 text-sm text-slate-400">
            &ldquo;{subject}&rdquo; — confirm this rejection to update{" "}
            <span className="text-slate-200">{companyName}</span>&apos;s status
            {gmailConnected ? " and archive the Gmail thread" : ""}.
          </p>
          {state === "error" && (
            <p className="mt-2 text-sm text-rose-400">Something went wrong. Try again.</p>
          )}
        </div>
        <Button
          onClick={confirmAndArchive}
          disabled={state === "busy"}
          className="shrink-0 border-rose-400/30 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
        >
          {state === "busy" ? "Confirming…" : gmailConnected ? "Confirm + Archive" : "Confirm Rejection"}
        </Button>
      </div>
    </Card>
  );
}
