import type Stripe from "stripe";
import { pool } from "@workspace/db";

/**
 * Extract the donation fields from a completed Checkout Session, matching the
 * webhook's field derivation exactly.
 */
export function donationFromSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const userId = session.metadata?.["userId"] ?? null;
  const anonymous = session.metadata?.["anonymous"] === "true";
  const country =
    session.customer_details?.address?.country ?? (session.metadata?.["country"] || null);

  return { email, amountCents, currency, userId, anonymous, country };
}

/**
 * Idempotently persist a donation for a completed Checkout Session.
 * Returns `true` when a new row was inserted, `false` when it was a no-op
 * (zero amount, or a donation already existed for this session id).
 */
export async function recordDonationFromSession(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const { email, amountCents, currency, userId, anonymous, country } =
    donationFromSession(session);

  if (amountCents <= 0) return false;

  const { rowCount } = await pool.query(
    `INSERT INTO donations (user_id, session_id, email, amount_cents, currency, country, anonymous)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_id) DO NOTHING`,
    [userId, session.id, email, amountCents, currency, country, anonymous],
  );

  return (rowCount ?? 0) > 0;
}
