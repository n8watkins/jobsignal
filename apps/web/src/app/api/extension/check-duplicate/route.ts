import { NextResponse } from "next/server";
import { findLikelyDuplicate } from "@/lib/jobs/duplicate";

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Replace [] with existing applications from Prisma.
  const match = findLikelyDuplicate(body, []);
  return NextResponse.json({ matchType: match?.matchType || "none", confidence: match?.confidence || 0, existingApplication: match?.item || null });
}
