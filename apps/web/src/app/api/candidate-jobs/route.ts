import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreCandidateJob } from "@/lib/candidate-jobs/scorer";
import { getScoringProfile } from "@/lib/profile/get-profile";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const DEFAULT_USER_NAME = "Nathan Watkins";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const user = await getUser();
  const candidateJobs = await prisma.candidateJob.findMany({
    where: { userId: user.id },
    orderBy: [{ fitScore: "desc" }, { createdAt: "desc" }],
  });
  return withCors(NextResponse.json({ candidateJobs }));
}

export async function POST(request: Request) {
  const input = await request.json();
  const user = await getUser();
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

async function getUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: { name: DEFAULT_USER_NAME },
    create: { email: DEFAULT_USER_EMAIL, name: DEFAULT_USER_NAME },
  });
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
