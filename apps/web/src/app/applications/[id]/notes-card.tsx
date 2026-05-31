"use client";

import { useState, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";

export function NotesCard({ applicationId, initialNotes }: { applicationId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const save = useCallback(
    async (value: string) => {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [applicationId]
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setNotes(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), 600);
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white">Notes</h2>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} /> Saved
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={onChange}
        placeholder="Call notes, interview impressions, recruiter details, questions to ask..."
        className="min-h-[180px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300 placeholder:text-slate-600 focus:border-white/20 focus:outline-none"
      />
    </Card>
  );
}
