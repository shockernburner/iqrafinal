import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { sendDonationThankYouEmail } from "../lib/email";

const router: IRouter = Router();

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

router.post("/", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(501).json({ error: "Stripe is not configured." });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(501).json({ error: "Stripe webhook signing secret is not configured." });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ error: "Missing Stripe-Signature header." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch (error) {
    logger.warn({ err: error }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO stripe_events (event_id, type, payload, processed_at)
       VALUES ($1, $2, $3::jsonb, now())
       ON CONFLICT (event_id) DO NOTHING`,
      [
        event.id,
        event.type,
        JSON.stringify(
          event.type === "checkout.session.completed"
            ? summarizeCheckoutSession(event.data.object as Stripe.Checkout.Session)
            : { objectId: (event.data.object as { id?: string }).id },
        ),
      ],
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      const amountCents = session.amount_total ?? 0;
      const currency = session.currency ?? "usd";
      const userId = session.metadata?.userId ?? null;
      const anonymous = session.metadata?.anonymous === "true";
      const country =
        session.customer_details?.address?.country ?? (session.metadata?.country || null);

      if (amountCents > 0) {
        await pool.query(
          `INSERT INTO donations (user_id, session_id, email, amount_cents, currency, country, anonymous)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (session_id) DO NOTHING`,
          [userId, session.id, email, amountCents, currency, country, anonymous],
        );
      }

      if (email && amountCents > 0) {
        await sendDonationThankYouEmail(email, amountCents);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error, eventId: event.id }, "Failed to process Stripe webhook event");
    res.status(500).json({ error: "Failed to process webhook event." });
  }
});

function summarizeCheckoutSession(session: Stripe.Checkout.Session) {
  return {
    sessionId: session.id,
    amountCents: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email ?? session.customer_email,
    userId: session.metadata?.userId ?? null,
  };
}

export default router;
