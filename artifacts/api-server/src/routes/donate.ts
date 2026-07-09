import { Router, type IRouter } from "express";
import { CreateDonationCheckoutBody, CreateDonationCheckoutResponse } from "@workspace/api-zod";
import { attachUser, requireUser, requireLegalAccepted } from "../lib/auth";
import { getClientIp, lookupCountry } from "../lib/geo";
import { getStripe } from "../lib/stripe-client";
import { normalizeCountry, resolveLocalizedDonation } from "../lib/pricing";

const router: IRouter = Router();

router.post("/donate", attachUser, requireUser, requireLegalAccepted, async (req, res) => {
  const body = CreateDonationCheckoutBody.parse(req.body);
  const stripe = getStripe();

  if (!stripe) {
    const data = CreateDonationCheckoutResponse.parse({ url: null });
    res.json(data);
    return;
  }

  // Canonical USD value: default to 25, floor at 1 (so USD unit_amount is never
  // below Stripe's minimum and never rounds to 0), and quantize to whole cents.
  const rawAmount = body.amount && body.amount > 0 ? body.amount : 25;
  const usdAmount = Math.max(1, Math.round(rawAmount * 100) / 100);
  const origin = req.headers.origin ?? `${req.protocol}://${req.get("host")}`;

  // Prefer the client's timezone-derived country hint; fall back to IP geo.
  // The country only ever changes the charged currency, never the USD value,
  // so trusting the hint carries no arbitrage risk (the server owns the amount).
  const country =
    normalizeCountry(body.country) ??
    (await lookupCountry(getClientIp(req.headers as Record<string, unknown>)));

  const pricing = resolveLocalizedDonation({ country, usdAmount });

  const metadata = {
    userId: req.user!.id,
    anonymous: body.anonymous ? "true" : "false",
    country: country ?? "",
    amount_usd: String(usdAmount),
  };

  // No explicit `payment_method_types`: leaving it unset lets Stripe present
  // every local method enabled in the dashboard that is eligible for the
  // session currency (UPI on INR, Pix on BRL, PayNow on SGD, …).
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "required",
    line_items: [
      {
        price_data: {
          currency: pricing.currency,
          product_data: { name: "IQRA Donation" },
          unit_amount: pricing.unitAmount,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/donate/thank-you`,
    cancel_url: `${origin}/donate`,
    metadata,
    payment_intent_data: { metadata },
  });

  const data = CreateDonationCheckoutResponse.parse({ url: session.url });
  res.json(data);
});

export default router;
