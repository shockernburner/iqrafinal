import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { amount = 25 } = (await request.json()) as { amount?: number };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const stripe = getStripe();
    const configuredDonationPrice = process.env.STRIPE_PRICE_DONATION;

    const lineItem = configuredDonationPrice && !configuredDonationPrice.startsWith("price_replace")
      ? { price: configuredDonationPrice, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: { name: "IQRA Donation" },
            unit_amount: Math.max(1, Math.round(amount * 100)),
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      metadata: {
        purpose: "donation",
      },
      line_items: [lineItem],
      success_url: `${appUrl}/donate/thank-you`,
      cancel_url: appUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create donation session." },
      { status: 500 },
    );
  }
}
