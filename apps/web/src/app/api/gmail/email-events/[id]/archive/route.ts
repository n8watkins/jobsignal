import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getValidAccessToken } from "@/lib/gmail/auth";
import { archiveThread } from "@/lib/gmail/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const event = await prisma.emailEvent.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (event.reviewStatus === "pending") {
    return NextResponse.json({ error: "Confirm or correct the classification before archiving." }, { status: 400 });
  }

  if (!user.googleRefreshToken) {
    return NextResponse.json({ error: "Gmail not connected." }, { status: 400 });
  }

  const accessToken = await getValidAccessToken(user.id);
  await archiveThread(accessToken, event.gmailThreadId);

  await prisma.emailEvent.update({ where: { id }, data: { archivedInGmail: true } });

  return NextResponse.json({ ok: true });
}
