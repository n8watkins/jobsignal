import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    resumeVersions: [
      { id: "resume_frontend_v3", name: "Frontend Resume v3", isDefault: true },
      { id: "resume_fullstack_v2", name: "Full Stack Resume v2", isDefault: false },
    ],
  });
}
