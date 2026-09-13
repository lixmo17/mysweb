import { NextResponse } from "next/server";
import { getExcludedQuestions, getStats } from "@/lib/records";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stats, excluded] = await Promise.all([
    getStats(),
    getExcludedQuestions(),
  ]);
  return NextResponse.json({ stats, excluded });
}
