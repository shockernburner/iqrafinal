import type Stripe from "stripe";
import { pool } from "@workspace/db";

/**
 * Extract the donation fields from a completed Checkout Session.
 *
 * `amountUsdCents` is the canonical USD value (from the `amount_usd` metadata
 * set at checkout) used for reporting and the thank-you email, so totals stay
 * in a single currency even when the donor was charged locally. `chargedAmount`
 * (in the currency's minor unit, matching Stripe's `amount_total`) and
 * `chargedCurrency` preserve the exact actual charge without rounding loss.
 */
export function donationFromSession(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const chargedCurrency = session.currency ?? "usd";
  // Minor units for decimal currencies, whole units for zero-decimal ones —
  // exactly as Stripe reports it, so the recorded charge is loss-free.
  const chargedAmount = session.amount_total ?? 0;

  const userId = session.metadata?.["userId"] ?? null;
  const anonymous = session.metadata?.["anonymous"] === "true";
  const country =
    session.customer_details?.address?.country ?? (session.metadata?.["country"] || null);

  // Canonical USD value. Prefer the metadata we stamped at checkout; fall back
  // to the charged amount only when it was already a USD session.
  const usdMeta = session.metadata?.["amount_usd"];
  const usdAmount =
    usdMeta != null && usdMeta !== "" && !Number.isNaN(Number(usdMeta))
      ? Number(usdMeta)
      : chargedCurrency === "usd"
        ? chargedAmount / 100
        : 0;
  const amountUsdCents = Math.round(usdAmount * 100);

  return { email, amountUsdCents, chargedAmount, chargedCurrency, userId, anonymous, country };
}

/**
 * Idempotently persist a donation for a completed Checkout Session.
 * Returns `true` when a new row was inserted, `false` when it was a no-op
 * (zero USD value, or a donation already existed for this session id).
 *
 * `amount_cents`/`currency` are stored as the canonical USD value; the actual
 * charged amount + currency are recorded in `charged_amount`/`charged_currency`.
 */
export async function recordDonationFromSession(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const { email, amountUsdCents, chargedAmount, chargedCurrency, userId, anonymous, country } =
    donationFromSession(session);

  if (amountUsdCents <= 0) return false;

  const { rowCount } = await pool.query(
    `INSERT INTO donations
       (user_id, session_id, email, amount_cents, currency, country, anonymous, charged_amount, charged_currency)
     VALUES ($1, $2, $3, $4, 'usd', $5, $6, $7, $8)
     ON CONFLICT (session_id) DO NOTHING`,
    [userId, session.id, email, amountUsdCents, country, anonymous, chargedAmount, chargedCurrency],
  );

  return (rowCount ?? 0) > 0;
}
