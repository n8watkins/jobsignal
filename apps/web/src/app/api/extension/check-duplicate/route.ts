import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findLikelyDuplicate } from "@/lib/jobs/duplicate";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = await request.json();

  const user = await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: DEFAULT_USER_NAME },
    create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
  });

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
