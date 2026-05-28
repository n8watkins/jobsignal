import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_STATUSES = new Set(["sourced", "viewed", "interested", "skipped", "applied", "archived"]);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const candidateJob = await prisma.candidateJob.findUnique({
    where: { id },
    include: { application: true, analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!candidateJob) return withCors(NextResponse.json({ error: "Candidate job not found" }, { status: 404 }));
  return withCors(NextResponse.json({ candidateJob }));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();

  if (body.status && !ALLOWED_STATUSES.has(body.status)) {
    return withCors(NextResponse.json({ error: "Invalid candidate job status" }, { status: 400 }));
  }

  const candidateJob = await prisma.candidateJob.update({
    where: { id },
    data: body.status ? { status: body.status } : {},
  });

  return withCors(NextResponse.json({ candidateJob }));
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value);
  return response;
}
