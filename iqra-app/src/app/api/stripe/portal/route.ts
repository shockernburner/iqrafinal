import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { uid } = (await request.json()) as { uid?: string };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (!uid) {
      return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    }

    const userDoc = await getAdminFirestore().collection("users").doc(uid).get();
    const customerId = userDoc.get("stripeCustomerId");

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found for this user." }, { status: 404 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create billing portal session." },
      { status: 500 },
    );
  }
}
