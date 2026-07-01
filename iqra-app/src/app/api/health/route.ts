import { NextResponse } from "next/server";
import { IQRA_POLICY_VERSION } from "@/lib/iqra-policy";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "iqra-app",
    policyVersion: IQRA_POLICY_VERSION,
    timestamp: new Date().toISOString(),
  });
}
