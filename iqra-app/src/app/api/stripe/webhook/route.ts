import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function resolveUid(session: Stripe.Checkout.Session) {
  if (session.metadata?.uid) {
    return session.metadata.uid;
  }

  if (session.client_reference_id) {
    return session.client_reference_id;
  }

  return undefined;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const uid = subscription.metadata.uid;

  if (!uid) {
    return;
  }

  await getAdminFirestore().collection("users").doc(uid).set(
    {
      plan: subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free",
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
      updatedAt: new Date(),
    },
    { merge: true },
  );
}

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

  const db = getAdminFirestore();
  const eventRef = db.collection("stripeEvents").doc(event.id);
  const eventDoc = await eventRef.get();

  if (eventDoc.exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await eventRef.set({ type: event.type, createdAt: new Date() });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = await resolveUid(session);

        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              plan: session.mode === "subscription" ? "pro" : "free",
              stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
              subscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
              subscriptionStatus: session.mode === "subscription" ? "trialing" : undefined,
              updatedAt: new Date(),
            },
            { merge: true },
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const uid = subscription.metadata.uid;

        if (uid) {
          await db.collection("users").doc(uid).set(
            {
              plan: "free",
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            },
            { merge: true },
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;

        if (subscriptionId) {
          const matchingUsers = await db
            .collection("users")
            .where("subscriptionId", "==", subscriptionId)
            .limit(1)
            .get();

          await Promise.all(
            matchingUsers.docs.map((doc) =>
              doc.ref.set({ subscriptionStatus: "past_due", updatedAt: new Date() }, { merge: true }),
            ),
          );
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await eventRef.set(
      { error: error instanceof Error ? error.message : "Webhook processing failed.", updatedAt: new Date() },
      { merge: true },
    );

    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
