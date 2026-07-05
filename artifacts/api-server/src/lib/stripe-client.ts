import Stripe from "stripe";

/**
 * Returns a configured Stripe client, or `null` when `STRIPE_SECRET_KEY` is not
 * set. Shared by the donate route, the webhook, and the donation reconciler so
 * they never drift apart.
 */
export function getStripe(): Stripe | null {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) return null;
  return new Stripe(secretKey);
}
