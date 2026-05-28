import { NextResponse } from "next/server";
import { getResearchQueue, queueBaselineResearchForAppliedApplications } from "@/lib/research/queue";

export async function GET() {
  const tasks = await getResearchQueue(100);
  return NextResponse.json({ tasks });
}

export async function POST() {
  const queued = await queueBaselineResearchForAppliedApplications();
  return NextResponse.json({ ok: true, queuedCount: queued.length, tasks: queued });
}
