import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  return NextResponse.json({ applicationId: id, event: body, message: "Application event API stub" });
}
