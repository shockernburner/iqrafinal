import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/authz";
import { query } from "@/lib/db";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
};

type DonationRow = {
  total_cents: string;
  donation_count: string;
};

type DonationEntryRow = {
  created_at: string;
  amount_cents: string;
  customer_email: string | null;
};

type TrainingFile = {
  totalRows?: number;
};

async function readTrainingCount() {
  const filePath = path.join(process.cwd(), "data", "training-questions.json");
  try {
    const file = JSON.parse(await readFile(filePath, "utf8")) as TrainingFile;
    return Number(file.totalRows ?? 0);
  } catch {
    return 0;
  }
}

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const usersResult = await query<UserRow>(
    `SELECT id, name, email, role, is_active, created_at::text
     FROM users
     ORDER BY created_at DESC
     LIMIT 200`,
  );

  let totalCents = 0;
  let donationCount = 0;
  let donations: DonationEntryRow[] = [];

  try {
    const donationSummary = await query<DonationRow>(
      `SELECT
         COALESCE(SUM((payload->'data'->'object'->>'amount_total')::bigint), 0)::text AS total_cents,
         COUNT(*)::text AS donation_count
       FROM stripe_events
       WHERE type = 'checkout.session.completed'
         AND payload->'data'->'object'->>'mode' = 'payment'
         AND COALESCE(payload->'data'->'object'->>'payment_status', '') = 'paid'`,
    );

    const row = donationSummary.rows[0];
    totalCents = Number(row?.total_cents ?? 0);
    donationCount = Number(row?.donation_count ?? 0);

    const donationRows = await query<DonationEntryRow>(
      `SELECT
         created_at::text,
         COALESCE(payload->'data'->'object'->>'amount_total', '0') AS amount_cents,
         payload->'data'->'object'->'customer_details'->>'email' AS customer_email
       FROM stripe_events
       WHERE type = 'checkout.session.completed'
         AND payload->'data'->'object'->>'mode' = 'payment'
         AND COALESCE(payload->'data'->'object'->>'payment_status', '') = 'paid'
       ORDER BY created_at DESC
       LIMIT 30`,
    );
    donations = donationRows.rows;
  } catch {
    // Stripe events table may not exist before migrations are applied.
  }

  const knowledgeSummary = await query<{ total_documents: string; active_documents: string }>(
    `SELECT
       COUNT(*)::text AS total_documents,
       COUNT(*) FILTER (WHERE status = 'active')::text AS active_documents
     FROM documents
     WHERE status <> 'deleted'`,
  );

  const trainingCount = await readTrainingCount();

  return NextResponse.json({
    users: usersResult.rows,
    donation: {
      totalCents,
      donationCount,
      recent: donations,
    },
    knowledge: {
      totalDocuments: Number(knowledgeSummary.rows[0]?.total_documents ?? 0),
      activeDocuments: Number(knowledgeSummary.rows[0]?.active_documents ?? 0),
    },
    training: {
      totalRows: trainingCount,
    },
  });
}