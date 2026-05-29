import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreCandidateJob } from "@/lib/candidate-jobs/scorer";
import { getScoringProfile } from "@/lib/profile/get-profile";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkExtensionSecret } from "@/lib/auth/extension-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-extension-secret",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const user = await getCurrentUser();
  const candidateJobs = await prisma.candidateJob.findMany({
    where: { userId: user.id },
    orderBy: [{ fitScore: "desc" }, { createdAt: "desc" }],
  });
  return withCors(NextResponse.json({ candidateJobs }));
}

export async function POST(request: Request) {
  if (!checkExtensionSecret(request)) {
    return withCors(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }
  const input = await request.json();
  const user = await getCurrentUser();
  const profile = await getScoringProfile(user.id);
  const score = scoreCandidateJob(input, profile);
  const existing = await findExistingCandidateJob(user.id, input);

  const data = {
    source: input.source || "linkedin",
    sourceJobId: input.sourceJobId,
    jobUrl: input.jobUrl,
    companyName: input.companyName || "Unknown Company",
    roleTitle: input.roleTitle || "Unknown Role",
    location: input.location,
    salaryText: input.salaryText,
    salaryListed: score.salaryListed,
    workArrangement: score.workArrangement,
    employmentType: score.employmentType,
    rawCardText: input.rawCardText,
    rawDescription: input.rawDescription,
    fitScore: score.fitScore,
    scoreLabel: score.scoreLabel,
    scoreReasons: JSON.stringify(score.scoreReasons),
    riskFlags: JSON.stringify(score.riskFlags),
    requiredTechnologies: JSON.stringify(score.detectedTechnologies),
    emphasisAreas: JSON.stringify(score.emphasisAreas),
  };

  const candidateJob = existing
    ? await prisma.candidateJob.update({ where: { id: existing.id }, data })
    : await prisma.candidateJob.create({ data: { userId: user.id, ...data } });

  return withCors(NextResponse.json({ candidateJob }));
}

async function findExistingCandidateJob(userId: string, input: any) {
  if (input.sourceJobId) {
    const bySourceId = await prisma.candidateJob.findFirst({ where: { userId, source: input.source || "linkedin", sourceJobId: input.sourceJobId } });
    if (bySourceId) return bySourceId;
  }
  if (input.jobUrl) {
    const byUrl = await prisma.candidateJob.findFirst({ where: { userId, jobUrl: input.jobUrl } });
    if (byUrl) return byUrl;
  }
  return prisma.candidateJob.findFirst({ where: { userId, companyName: input.companyName || "Unknown Company", roleTitle: input.roleTitle || "Unknown Role" } });
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  return response;
}
