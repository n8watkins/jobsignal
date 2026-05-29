import { NextResponse } from "next/server";
import { extractJobDescription } from "@/lib/ai/analyze-job";

export async function POST(request: Request) {
  const { rawDescription } = await request.json();
  if (!rawDescription || typeof rawDescription !== "string") {
    return NextResponse.json({ error: "rawDescription required" }, { status: 400 });
  }
  const extraction = await extractJobDescription({ rawDescription });
  return NextResponse.json({ extraction });
}
