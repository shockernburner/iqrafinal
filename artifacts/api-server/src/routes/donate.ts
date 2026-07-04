import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { CreateDonationCheckoutBody, CreateDonationCheckoutResponse } from "@workspace/api-zod";
import { attachUser, requireUser, requireLegalAccepted } from "../lib/auth";

const router: IRouter = Router();

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

router.post("/donate", attachUser, requireUser, requireLegalAccepted, async (req, res) => {
  const body = CreateDonationCheckoutBody.parse(req.body);
  const stripe = getStripe();

  if (!stripe) {
    const data = CreateDonationCheckoutResponse.parse({ url: null });
    res.json(data);
    return;
  }

  const amountCents = body.amount && body.amount > 0 ? Math.round(body.amount * 100) : 2500;
  const origin = req.headers.origin ?? `${req.protocol}://${req.get("host")}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "IQRA Donation" },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/donate/thank-you`,
    cancel_url: `${origin}/donate`,
    metadata: { userId: req.user!.id },
  });

  const data = CreateDonationCheckoutResponse.parse({ url: session.url });
  res.json(data);
});

export default router;
