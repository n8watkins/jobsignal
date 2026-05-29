import { NextResponse } from "next/server";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";
import { getDefaultResumeText } from "@/lib/resume/default-resume";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const extraction = await extractJobDescription(body);
  const resumeText = body.resumeText || (await getDefaultResumeText()) || undefined;
  const analysis = await analyzeJobFit({ rawDescription: body.rawDescription, resumeText, extraction });
  return NextResponse.json({ applicationId: id, extraction, analysis });
}
