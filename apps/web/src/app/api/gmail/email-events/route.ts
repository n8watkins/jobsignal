import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const onlyPending = searchParams.get("pending") === "1";

  const events = await prisma.emailEvent.findMany({
    where: {
      userId: user.id,
      ...(onlyPending ? { reviewStatus: "pending", archivedInGmail: false } : {}),
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
    include: {
      application: {
        include: { jobPosting: { select: { companyName: true, roleTitle: true } } },
      },
    },
  });

  return NextResponse.json({ events });
}
