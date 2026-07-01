import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

const priceByPlan = {
  monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
};

type Plan = keyof typeof priceByPlan;

export async function POST(request: NextRequest) {
  try {
    const { plan = "monthly", uid, email } = (await request.json()) as {
      plan?: Plan;
      uid?: string;
      email?: string;
    };

    const priceId = priceByPlan[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (!priceId || priceId.startsWith("price_replace")) {
      return NextResponse.json({ error: "Stripe price id is not configured." }, { status: 400 });
    }

    const stripe = getStripe();
    let customerId: string | undefined;

    if (uid) {
      const db = getAdminFirestore();
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      customerId = userDoc.get("stripeCustomerId");

      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { uid },
        });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId, email, updatedAt: new Date() }, { merge: true });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : email,
      client_reference_id: uid,
      metadata: uid ? { uid } : undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: uid ? { uid } : undefined,
      },
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Checkout session." },
      { status: 500 },
    );
  }
}
