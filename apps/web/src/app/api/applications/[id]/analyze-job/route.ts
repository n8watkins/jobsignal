import { NextResponse } from "next/server";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const extraction = await extractJobDescription(body);
  const analysis = await analyzeJobFit({ rawDescription: body.rawDescription, resumeText: body.resumeText, extraction });
  return NextResponse.json({ applicationId: params.id, extraction, analysis });
}
