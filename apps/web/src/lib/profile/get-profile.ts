import { prisma } from "@/lib/prisma";
import { profileRecordToValues, type JobSearchProfileValues } from "./profile-utils";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

/**
 * Loads the persisted JobSearchProfile as plain values, falling back to
 * DEFAULT_JOB_SEARCH_PROFILE when no row exists. Read-only — never creates a
 * user. Pass a known userId to skip the email lookup.
 */
export async function getScoringProfile(userId?: string): Promise<JobSearchProfileValues> {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
    resolvedUserId = user?.id;
  }
  const record = resolvedUserId
    ? await prisma.jobSearchProfile.findUnique({ where: { userId: resolvedUserId } })
    : null;
  return profileRecordToValues(record);
}
