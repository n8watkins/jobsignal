import { prisma } from "@/lib/prisma";
import { SINGLE_USER_EMAIL } from "@/lib/auth/current-user";

/**
 * Text of the user's default resume, used as the baseline for job-fit
 * analysis. Returns null when no resume has been saved (callers fall back to
 * a generic profile). Pass a known userId to skip the email lookup.
 */
export async function getDefaultResumeText(userId?: string): Promise<string | null> {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const user = await prisma.user.findUnique({ where: { email: SINGLE_USER_EMAIL } });
    resolvedUserId = user?.id;
  }
  if (!resolvedUserId) return null;
  const resume = await prisma.resumeVersion.findFirst({
    where: { userId: resolvedUserId, isDefault: true },
    select: { rawText: true },
  });
  return resume?.rawText ?? null;
}
