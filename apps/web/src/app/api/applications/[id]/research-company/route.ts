import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return NextResponse.json({
    applicationId: id,
    companyName: body.companyName,
    message: "Company research stub. Wire search/provider later.",
    research: {
      summary: "Research not yet connected.",
      sources: [],
      researchedAt: new Date().toISOString(),
    },
  });
}
