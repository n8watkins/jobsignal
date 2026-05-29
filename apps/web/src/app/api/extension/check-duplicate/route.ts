import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findLikelyDuplicate } from "@/lib/jobs/duplicate";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkExtensionSecret } from "@/lib/auth/extension-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-extension-secret",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  if (!checkExtensionSecret(request)) {
    return withCors(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }
  const body = await request.json();

  const user = await getCurrentUser();

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { jobPosting: true },
  });

  const candidates = applications.map((app) => ({
    id: app.id,
    companyName: app.jobPosting.companyName,
    roleTitle: app.jobPosting.roleTitle,
    jobUrl: app.jobPosting.jobUrl,
    sourceJobId: app.jobPosting.sourceJobId,
    location: app.jobPosting.location,
    status: app.status,
  }));

  const match = findLikelyDuplicate(body, candidates);
  return withCors(NextResponse.json({
    matchType: match?.matchType || "none",
    confidence: match?.confidence || 0,
    existingApplication: match?.item || null,
  }));
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  return response;
}
