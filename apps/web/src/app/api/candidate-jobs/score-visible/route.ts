import { NextResponse } from "next/server";
import { scoreCandidateJob } from "@/lib/candidate-jobs/scorer";

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
  const jobs = Array.isArray(body.jobs) ? body.jobs : [];

  const scoredJobs = jobs.map((job) => ({
    ...job,
    ...scoreCandidateJob(job),
  }));

  return withCors(NextResponse.json({ jobs: scoredJobs }));
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
