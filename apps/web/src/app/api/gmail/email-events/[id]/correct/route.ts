import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ id: params.id, action: "correct", body, message: "Gmail correct stub" });
}
