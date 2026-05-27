import { NextResponse } from "next/server";
import { CapturedJobSchema } from "@jobsignal/shared";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";

export async function GET() {
  // TODO: Replace mock with prisma.application.findMany({ include: { jobPosting: true } })
  return NextResponse.json({ applications: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CapturedJobSchema.safeParse({
    source: body.source || "manual",
    companyName: body.companyName,
    roleTitle: body.roleTitle,
    jobUrl: body.jobUrl || undefined,
    location: body.location || undefined,
    rawDescription: body.rawDescription || undefined,
    salaryListed: Boolean(body.salaryText),
    salaryText: body.salaryText || null,
    applicationMethod: body.applicationMethod || "manual",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const extraction = await extractJobDescription(parsed.data);
  const analysis = await analyzeJobFit({ rawDescription: parsed.data.rawDescription, extraction });

  // TODO: Persist JobPosting, Application, ApplicationEvent, JobAnalysis.
  return NextResponse.json({
    message: "Application create flow stubbed. Wire Prisma persistence next.",
    captured: parsed.data,
    extraction,
    analysis,
  });
}
