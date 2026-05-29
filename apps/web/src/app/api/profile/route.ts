import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_JOB_SEARCH_PROFILE } from "@/lib/profile/default-profile";
import { profileRecordToValues, stringifyList } from "@/lib/profile/profile-utils";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();
  const record = await prisma.jobSearchProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile: profileRecordToValues(record) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await getCurrentUser();
  const profile = await prisma.jobSearchProfile.upsert({
    where: { userId: user.id },
    update: {
      targetRoles: stringifyList(body.targetRoles),
      strongTechnologies: stringifyList(body.strongTechnologies),
      secondaryTechnologies: stringifyList(body.secondaryTechnologies),
      learningTechnologies: stringifyList(body.learningTechnologies),
      avoidTerms: stringifyList(body.avoidTerms),
      preferredWorkArrangement: body.preferredWorkArrangement || DEFAULT_JOB_SEARCH_PROFILE.preferredWorkArrangement,
      preferredEmploymentType: body.preferredEmploymentType || DEFAULT_JOB_SEARCH_PROFILE.preferredEmploymentType,
      salaryFloor: body.salaryFloor ? Number(body.salaryFloor) : null,
      preferredLocation: body.preferredLocation || null,
      recruiterTolerance: body.recruiterTolerance || DEFAULT_JOB_SEARCH_PROFILE.recruiterTolerance,
    },
    create: {
      userId: user.id,
      targetRoles: stringifyList(body.targetRoles || DEFAULT_JOB_SEARCH_PROFILE.targetRoles),
      strongTechnologies: stringifyList(body.strongTechnologies || DEFAULT_JOB_SEARCH_PROFILE.strongTechnologies),
      secondaryTechnologies: stringifyList(body.secondaryTechnologies || DEFAULT_JOB_SEARCH_PROFILE.secondaryTechnologies),
      learningTechnologies: stringifyList(body.learningTechnologies || DEFAULT_JOB_SEARCH_PROFILE.learningTechnologies),
      avoidTerms: stringifyList(body.avoidTerms || DEFAULT_JOB_SEARCH_PROFILE.avoidTerms),
      preferredWorkArrangement: body.preferredWorkArrangement || DEFAULT_JOB_SEARCH_PROFILE.preferredWorkArrangement,
      preferredEmploymentType: body.preferredEmploymentType || DEFAULT_JOB_SEARCH_PROFILE.preferredEmploymentType,
      salaryFloor: body.salaryFloor ? Number(body.salaryFloor) : DEFAULT_JOB_SEARCH_PROFILE.salaryFloor,
      preferredLocation: body.preferredLocation || DEFAULT_JOB_SEARCH_PROFILE.preferredLocation,
      recruiterTolerance: body.recruiterTolerance || DEFAULT_JOB_SEARCH_PROFILE.recruiterTolerance,
    },
  });
  return NextResponse.json({ profile: profileRecordToValues(profile) });
}
