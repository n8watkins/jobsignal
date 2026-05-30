import { NextResponse } from "next/server";
import { extractJobDescription, analyzeJobFit } from "@/lib/ai/analyze-job";

export async function POST(request: Request) {
  const { rawDescription } = await request.json() as { rawDescription?: string };
  if (!rawDescription) return NextResponse.json({ error: "rawDescription required" }, { status: 400 });

  const extraction = await extractJobDescription({ rawDescription });
  const analysis = await analyzeJobFit({ rawDescription, extraction });

  return NextResponse.json({ extraction, analysis });
}
