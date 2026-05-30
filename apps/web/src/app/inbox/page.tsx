import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { InboxTable } from "./inbox-table";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getCurrentUser();

  const events = await prisma.emailEvent.findMany({
    where: { userId: user.id },
    orderBy: { receivedAt: "desc" },
    take: 100,
    include: {
      application: {
        include: { jobPosting: { select: { companyName: true, roleTitle: true } } },
      },
    },
  });

  const gmailConnected = Boolean(user.googleRefreshToken);

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Inbox Signals</h1>
          <p className="mt-2 text-slate-400">
            {gmailConnected
              ? "Classified recruiting emails from Gmail."
              : "Gmail not connected — connect in Settings to start scanning."}
          </p>
        </div>
      </header>
      <Card className="overflow-hidden">
        <InboxTable events={events} gmailConnected={gmailConnected} />
      </Card>
    </AppShell>
  );
}
