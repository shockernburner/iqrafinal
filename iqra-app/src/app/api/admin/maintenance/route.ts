import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/authz";
import {
  getAdminMaintenanceStatus,
  startAdminMaintenance,
  type AdminMaintenanceAction,
} from "@/lib/admin-maintenance";

const allowedActions = new Set<AdminMaintenanceAction>([
  "refresh-knowledge-index",
  "refresh-training-dataset",
  "refresh-all",
]);

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  return NextResponse.json(getAdminMaintenanceStatus());
}

export async function POST(request: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const { action } = (await request.json()) as { action?: AdminMaintenanceAction };
  if (!action || !allowedActions.has(action)) {
    return NextResponse.json({ error: "Unsupported maintenance action." }, { status: 400 });
  }

  const started = startAdminMaintenance(action, session.user.id);
  return NextResponse.json(started, { status: started.started ? 202 : 409 });
}