import { NextResponse } from "next/server";
import { scoreCandidateJob, type CandidateJobInput } from "@/lib/candidate-jobs/scorer";
import { getScoringProfile } from "@/lib/profile/get-profile";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { jobs?: CandidateJobInput[] };
  const jobs: CandidateJobInput[] = Array.isArray(body.jobs) ? body.jobs : [];

  // Fetch the profile once; scoreCandidateJob memoizes derived terms per profile.
  const profile = await getScoringProfile();
  const scoredJobs = jobs.map((job: CandidateJobInput) => ({
    ...job,
    ...scoreCandidateJob(job, profile),
  }));

  return withCors(NextResponse.json({ jobs: scoredJobs }));
}

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
