import { pool } from "@workspace/db";
import { logger } from "./logger";
import { getStripe } from "./stripe-client";
import { recordDonationFromSession } from "./donations";

/**
 * Self-healing backfill: every `checkout.session.completed` event we received is
 * recorded in `stripe_events`, but a transient failure (e.g. a DB/schema race on
 * a fresh deploy instance) can leave the matching `donations` row missing. On
 * boot we find any completed-checkout event that has no donation row, re-fetch
 * the full session from Stripe, and insert it.
 *
 * Normal case: the query returns zero rows and no Stripe calls are made. This is
 * best-effort and must never block startup.
 */
export async function reconcileDonations(): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  let sessionIds: string[];
  try {
    const { rows } = await pool.query<{ session_id: string }>(
      `SELECT DISTINCT (payload->>'sessionId') AS session_id
         FROM stripe_events
        WHERE type = 'checkout.session.completed'
          AND payload->>'sessionId' IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM donations d
             WHERE d.session_id = payload->>'sessionId'
          )
        LIMIT 100`,
    );
    sessionIds = rows.map((r) => r.session_id);
  } catch (err) {
    logger.error({ err }, "Donation reconciliation query failed");
    return;
  }

  if (sessionIds.length === 0) return;

  let recovered = 0;
  for (const sessionId of sessionIds) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid" && session.status !== "complete") continue;
      if (await recordDonationFromSession(session)) recovered += 1;
    } catch (err) {
      logger.error({ err, sessionId }, "Failed to reconcile donation for session");
    }
  }

  if (recovered > 0) {
    logger.info({ recovered, checked: sessionIds.length }, "Backfilled missing donations");
  }
}
