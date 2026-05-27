import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({
    applicationId: params.id,
    companyName: body.companyName,
    message: "Company research stub. Wire search/provider later.",
    research: {
      summary: "Research not yet connected.",
      sources: [],
      researchedAt: new Date().toISOString(),
    },
  });
}
