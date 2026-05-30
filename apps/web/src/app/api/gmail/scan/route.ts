import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getValidAccessToken } from "@/lib/gmail/auth";
import { searchThreads, getThread, extractHeader } from "@/lib/gmail/client";
import { classifyRecruitingEmail } from "@/lib/ai/classify-email";
import { upsertEmailEvent } from "@/lib/gmail/events";

const SCAN_QUERY =
  "label:inbox newer_than:30d " +
  "(subject:application OR subject:interview OR subject:offer OR subject:assessment " +
  "OR subject:\"coding challenge\" OR subject:rejected OR subject:\"moving forward\" " +
  "OR subject:opportunity OR subject:candidate OR subject:recruiter)";

export async function POST() {
  const user = await getCurrentUser();

  if (!user.googleRefreshToken) {
    return NextResponse.json(
      { error: "Gmail not connected. Connect via Settings." },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(user.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Token error" },
      { status: 401 }
    );
  }

  const threads = await searchThreads(accessToken, SCAN_QUERY, 50);
  let created = 0;
  let skipped = 0;

  for (const { id: threadId } of threads) {
    try {
      const thread = await getThread(accessToken, threadId);
      const firstMsg = thread.messages[0];
      if (!firstMsg) continue;

      const from = extractHeader(firstMsg, "From");
      const subject = extractHeader(firstMsg, "Subject");
      const snippet = firstMsg.snippet ?? "";
      const dateStr = extractHeader(firstMsg, "Date");
      const receivedAt = dateStr ? new Date(dateStr) : new Date();

      // Parse "Name <email>" or bare email
      const emailMatch = from.match(/<(.+?)>/) ?? from.match(/(\S+@\S+)/);
      const senderEmail = emailMatch?.[1] ?? from;
      const senderName = from.includes("<") ? from.split("<")[0].trim().replace(/^"|"$/g, "") : null;

      const classification = await classifyRecruitingEmail({
        sender: senderEmail,
        subject,
        snippet,
      });

      // Skip obvious noise
      if (classification.classification === "job_alert_noise" && classification.confidence > 0.8) {
        skipped++;
        continue;
      }

      const result = await upsertEmailEvent({
        userId: user.id,
        gmailMessageId: firstMsg.id,
        gmailThreadId: threadId,
        senderEmail,
        senderName,
        subject,
        snippet,
        receivedAt,
        classification,
      });

      if (result.created) created++;
      else skipped++;
    } catch {
      // Skip malformed threads rather than aborting the whole scan
    }
  }

  return NextResponse.json({ ok: true, created, skipped, total: threads.length });
}
