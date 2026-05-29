import { prisma } from "@/lib/prisma";

// Single-user beta: every request resolves to one allowlisted account.
export const SINGLE_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";
const SINGLE_USER_NAME = "Nathan Watkins";

/**
 * Resolves (creating on first call) the single beta user. Replace this with a
 * real session lookup when multi-user auth lands — call sites only need a user.
 */
export function getCurrentUser() {
  return prisma.user.upsert({
    where: { email: SINGLE_USER_EMAIL },
    update: { name: SINGLE_USER_NAME },
    create: { email: SINGLE_USER_EMAIL, name: SINGLE_USER_NAME },
  });
}
