import { NextResponse } from "next/server";
import { classifyRecruitingEmail } from "@/lib/ai/classify-email";

export async function POST() {
  // TODO: Replace with Gmail API query + token flow.
  const sample = await classifyRecruitingEmail({
    sender: "careers@example.com",
    subject: "Update on your application",
    snippet: "Unfortunately, we are moving forward with other candidates.",
  });
  return NextResponse.json({ message: "Gmail scan stub", sampleClassification: sample });
}
