import { NextResponse } from "next/server";
import { MarkAppliedRequestSchema } from "@jobsignal/shared";
import { analyzeJobFit, extractJobDescription } from "@/lib/ai/analyze-job";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = MarkAppliedRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const extraction = await extractJobDescription(parsed.data);
  const analysis = await analyzeJobFit({ rawDescription: parsed.data.rawDescription, extraction });

  // TODO: persist user, jobPosting, application, event, analysis.
  return NextResponse.json({
    applicationId: `stub_app_${Date.now()}`,
    jobPostingId: `stub_job_${Date.now()}`,
    status: "applied",
    duplicateStatus: "not_checked_in_stub",
    analysisQueued: true,
    extraction,
    analysis,
  });
}
