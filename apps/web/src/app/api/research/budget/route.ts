import { NextResponse } from "next/server";
import { getResearchBudgetSnapshot } from "@/lib/research/budget";

export async function GET() {
  const budget = await getResearchBudgetSnapshot();
  return NextResponse.json({ budget });
}
