import { NextResponse } from "next/server";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const extraction = await extractJobDescription(body);
  const analysis = await analyzeJobFit({ rawDescription: body.rawDescription, resumeText: body.resumeText, extraction });
  return NextResponse.json({ applicationId: id, extraction, analysis });
}
