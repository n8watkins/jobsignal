import { prisma } from "@/lib/prisma";
import type { EmailClassificationResult } from "@jobsignal/shared";

type UpsertInput = {
  userId: string;
  gmailMessageId: string;
  gmailThreadId: string;
  senderEmail: string;
  senderName: string | null;
  subject: string;
  snippet: string;
  receivedAt: Date;
  classification: EmailClassificationResult;
};

export async function upsertEmailEvent(input: UpsertInput): Promise<{ created: boolean }> {
  const existing = await prisma.emailEvent.findUnique({
    where: { userId_gmailMessageId: { userId: input.userId, gmailMessageId: input.gmailMessageId } },
  });
  if (existing) return { created: false };

  // Try to link to an application by fuzzy-matching company name
  const applicationId = await findLinkedApplicationId(input.userId, input.senderEmail, input.subject);

  await prisma.emailEvent.create({
    data: {
      userId: input.userId,
      applicationId,
      gmailMessageId: input.gmailMessageId,
      gmailThreadId: input.gmailThreadId,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
      subject: input.subject,
      snippet: input.snippet,
      receivedAt: input.receivedAt,
      classification: input.classification.classification,
      confidence: input.classification.confidence,
      reason: input.classification.reason ?? null,
      actionNeeded: input.classification.actionNeeded,
      suggestedNextAction: input.classification.suggestedNextAction ?? null,
      reviewStatus: "pending",
    },
  });

  return { created: true };
}

async function findLinkedApplicationId(
  userId: string,
  senderEmail: string,
  subject: string
): Promise<string | null> {
  // Extract company domain from sender email (e.g. "careers@stripe.com" → "stripe")
  const domain = senderEmail.split("@")[1]?.split(".")[0]?.toLowerCase();
  if (!domain || domain === "gmail" || domain === "yahoo" || domain === "outlook") return null;

  const applications = await prisma.application.findMany({
    where: { userId },
    include: { jobPosting: { select: { companyName: true } } },
  });

  const domainMatch = applications.find((a) =>
    a.jobPosting.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").includes(domain)
  );
  if (domainMatch) return domainMatch.id;

  // Fallback: check if any company name appears in the subject
  const subjectLower = subject.toLowerCase();
  const subjectMatch = applications.find((a) => {
    const company = a.jobPosting.companyName.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    return company.length > 2 && subjectLower.includes(company);
  });

  return subjectMatch?.id ?? null;
}

export const CLASSIFICATION_TO_APP_STATUS: Record<string, string> = {
  rejection: "rejected",
  interview_request: "interview_requested",
  assessment_request: "assessment_requested",
  application_confirmation: "application_confirmed",
  offer: "offer_final_stage",
  recruiter_outreach: "recruiter_responded",
};
