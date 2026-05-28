import { Badge, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { DEFAULT_JOB_SEARCH_PROFILE } from "@/lib/profile/default-profile";
import { profileRecordToValues } from "@/lib/profile/profile-utils";

const DEFAULT_USER_EMAIL = process.env.SINGLE_USER_EMAIL || "nathancwatkins23@gmail.com";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
  const record = user ? await prisma.jobSearchProfile.findUnique({ where: { userId: user.id } }) : null;
  const profile = profileRecordToValues(record);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">JobSignal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Job Search Profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">This profile controls how Job Radar scores sourced jobs.</p>
        </div>
        <section className="grid gap-4 md:grid-cols-2">
          <ProfileCard title="Target Roles" items={profile.targetRoles} />
          <ProfileCard title="Strong Technologies" items={profile.strongTechnologies} />
          <ProfileCard title="Secondary Technologies" items={profile.secondaryTechnologies} />
          <ProfileCard title="Learning / Gap Technologies" items={profile.learningTechnologies} />
          <ProfileCard title="Avoid Terms" items={profile.avoidTerms} danger />
          <Card className="p-5">
            <h2 className="font-semibold text-white">Preferences</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <Meta label="Work arrangement" value={profile.preferredWorkArrangement} />
              <Meta label="Employment type" value={profile.preferredEmploymentType} />
              <Meta label="Salary floor" value={profile.salaryFloor ? `$${profile.salaryFloor.toLocaleString()}` : "Not set"} />
              <Meta label="Location" value={profile.preferredLocation || DEFAULT_JOB_SEARCH_PROFILE.preferredLocation} />
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ProfileCard({ title, items, danger = false }: { title: string; items: string[]; danger?: boolean }) {
  return <Card className="p-5"><h2 className="font-semibold text-white">{title}</h2><div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <Badge key={item} className={danger ? "border-rose-400/20 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"}>{item}</Badge>)}</div></Card>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span>{value}</span></div>;
}
