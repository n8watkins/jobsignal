import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { profileRecordToValues } from "@/lib/profile/profile-utils";
import { ProfileForm } from "./profile-form";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
  const record = user ? await prisma.jobSearchProfile.findUnique({ where: { userId: user.id } }) : null;
  const profile = profileRecordToValues(record);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <ProfileForm initialProfile={profile} />
      </div>
    </AppShell>
  );
}
