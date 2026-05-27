import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ id: params.id, message: "Application detail API stub" });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({ id: params.id, updated: body, message: "Application update API stub" });
}
