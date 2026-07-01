import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const checks: Record<string, "ok" | "missing" | "failed"> = {
    database: "missing",
    localLlm: process.env.LOCAL_LLM_ENDPOINT ? "ok" : "missing",
    localStt: process.env.LOCAL_STT_ENDPOINT ? "ok" : "missing",
  };

  if (process.env.DATABASE_URL) {
    try {
      await query("SELECT 1");
      checks.database = "ok";
    } catch {
      checks.database = "failed";
    }
  }

  const ready = checks.database === "ok";
  return NextResponse.json({ ready, checks, timestamp: new Date().toISOString() }, { status: ready ? 200 : 503 });
}
