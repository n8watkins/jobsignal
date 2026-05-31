"use client";

import { useState, useEffect } from "react";
import { Calendar, BookOpen } from "lucide-react";
import { Card } from "@/components/ui";

function daysUntil(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function toLocalDatetimeValue(date: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewSchedulerCard({
  applicationId,
  initialDate,
  techStack,
  requiredSkills,
}: {
  applicationId: string;
  initialDate: Date | null;
  techStack: string[];
  requiredSkills: string[];
}) {
  const [dateValue, setDateValue] = useState(() => toLocalDatetimeValue(initialDate));
  const [saving, setSaving] = useState(false);
  const storageKey = `study-${applicationId}`;

  const studyTopics = [...new Set([...techStack, ...requiredSkills])].slice(0, 14);

  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch {}
  }, [storageKey]);

  function toggleDone(topic: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  async function saveDate(value: string) {
    setSaving(true);
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewDate: value ? new Date(value).toISOString() : null }),
    });
    setSaving(false);
  }

  const parsedDate = dateValue ? new Date(dateValue) : null;
  const days = parsedDate ? daysUntil(parsedDate) : null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">Interview Prep</h2>
        <Calendar size={18} className="text-slate-500" />
      </div>

      <div className="mb-5">
        <label className="mb-1.5 block text-xs text-slate-500">Interview date & time</label>
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => { setDateValue(e.target.value); saveDate(e.target.value); }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-200 focus:border-white/20 focus:outline-none [color-scheme:dark]"
        />
        {parsedDate && days !== null && (
          <p className={`mt-2 text-sm font-medium ${days < 0 ? "text-slate-500" : days === 0 ? "text-rose-400" : days === 1 ? "text-amber-400" : days <= 3 ? "text-amber-400" : "text-emerald-400"}`}>
            {days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days away`}
          </p>
        )}
        {saving && <p className="mt-1 text-xs text-slate-600">Saving…</p>}
      </div>

      {studyTopics.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
            <BookOpen size={11} /> Study Checklist
          </p>
          <div className="space-y-2">
            {studyTopics.map((topic) => (
              <label
                key={topic}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 transition hover:bg-white/[0.05]"
              >
                <input
                  type="checkbox"
                  checked={done.has(topic)}
                  onChange={() => toggleDone(topic)}
                  className="accent-indigo-500"
                />
                <span className={`text-sm ${done.has(topic) ? "text-slate-500 line-through" : "text-slate-300"}`}>
                  {topic}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            {done.size}/{studyTopics.length} covered
          </p>
        </div>
      )}

      {studyTopics.length === 0 && (
        <p className="text-sm text-slate-500">
          No tech stack or required skills on file. Analyze the JD to generate study topics.
        </p>
      )}
    </Card>
  );
}
