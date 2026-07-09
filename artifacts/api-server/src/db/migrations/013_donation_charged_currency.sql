-- Records the actual currency + amount a donor was charged, separate from the
-- canonical USD value stored in amount_cents/currency. Donations charged in a
-- local currency (to unlock local Stripe payment methods) keep amount_cents in
-- USD for consistent reporting, while these columns preserve the real charge.
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS charged_amount integer,
  ADD COLUMN IF NOT EXISTS charged_currency text;
