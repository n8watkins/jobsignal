import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({ applicationId: params.id, event: body, message: "Application event API stub" });
}
