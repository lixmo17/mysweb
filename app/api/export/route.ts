import { NextResponse } from "next/server";
import { exportStatsToFile } from "@/lib/records";

export const dynamic = "force-dynamic";

export async function POST() {
  const filePath = await exportStatsToFile();
  return NextResponse.json({ ok: true, path: filePath });
}
