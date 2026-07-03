import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { query } from "@/lib/db";
import { sendDonationThankYou } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook signature is not configured." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature." },
      { status: 400 },
    );
  }

  try {
    const inserted = await query<{ inserted: boolean }>(
      `INSERT INTO stripe_events (event_id, type, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING true AS inserted`,
      [event.id, event.type, JSON.stringify(event)],
    );

    if (!inserted.rows.length) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          const email = session.customer_details?.email ?? undefined;

          if (email) {
            await sendDonationThankYou({ to: email, amountCents: session.amount_total });
          }
        }

        break;
      }
      default:
        break;
    }

    await query(
      `UPDATE stripe_events
       SET processed_at = now(), updated_at = now(), error = NULL
       WHERE event_id = $1`,
      [event.id],
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    await query(
      `UPDATE stripe_events
       SET error = $2, updated_at = now()
       WHERE event_id = $1`,
      [event.id, error instanceof Error ? error.message : "Webhook processing failed."],
    );

    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
