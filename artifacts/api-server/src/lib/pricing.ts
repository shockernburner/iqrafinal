/**
 * Localized donation pricing (USD-equivalent).
 *
 * Donations are chosen in USD. To unlock local Stripe payment methods (UPI,
 * Pix, PayNow, BLIK, Bancontact, EPS, MB WAY, GrabPay, Alipay, Naver/Samsung
 * Pay…) the Checkout session must be created in the buyer's local currency.
 * We convert the chosen USD amount to a clean local number using a curated,
 * hand-set FX rate (NOT live FX) — the server always owns the amount, so a
 * spoofed country hint only swaps the currency, never the real value.
 *
 * The canonical USD value is carried separately (see donations.ts) so all
 * reporting stays in a single currency.
 *
 * NOTE: this file is mirrored on the client in
 * artifacts/iqra-assistant/src/lib/local-payments.ts. The two must stay in
 * lockstep — the maps below (COUNTRY_CURRENCY, CURRENCY_RATE) and the rounding
 * logic (roundLocalMajor) must match exactly, or the amount the donor sees
 * won't match the amount they're charged.
 */

// Stripe zero-decimal currencies — charged in WHOLE major units (no ×100).
// Any zero-decimal currency added below MUST live here or the charge is 100× off.
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx",
  "vnd", "vuv", "xaf", "xof", "xpf",
]);

export function toMinorUnit(currency: string, major: number): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? Math.round(major) : Math.round(major * 100);
}

export function toMajorUnit(currency: string, minor: number): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? Math.round(minor) : Math.round(minor / 100);
}

// USD → local currency conversion. Value = local major units per 1 USD.
// Curated round numbers, not live FX; keep in sync with the client.
export const CURRENCY_RATE: Record<string, number> = {
  usd: 1,
  inr: 83,
  brl: 5,
  sgd: 1.35,
  myr: 4.7,
  pln: 4,
  eur: 0.92,
  krw: 1350,
  cny: 7.2,
};

// ISO-3166 alpha-2 country → currency. Unlisted countries charge USD.
export const COUNTRY_CURRENCY: Record<string, string> = {
  IN: "inr",
  BR: "brl",
  SG: "sgd",
  MY: "myr",
  PL: "pln",
  KR: "krw",
  CN: "cny",
  // Eurozone — all map to the single eur rate.
  AT: "eur",
  BE: "eur",
  DE: "eur",
  ES: "eur",
  FI: "eur",
  FR: "eur",
  IE: "eur",
  IT: "eur",
  NL: "eur",
  PT: "eur",
};

export function normalizeCountry(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Round a raw converted amount to a clean local number. Mirrored on the client.
 */
export function roundLocalMajor(currency: string, raw: number): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return Math.max(100, Math.round(raw / 100) * 100);
  if (currency === "inr") return Math.max(10, Math.round(raw / 10) * 10);
  return Math.max(1, Math.round(raw));
}

export interface LocalizedDonation {
  currency: string;
  /** Amount in the currency's minor unit, ready for Stripe `unit_amount`. */
  unitAmount: number;
  /** Amount in major units (for display / logging). */
  unitAmountMajor: number;
  /** Canonical USD value the donor selected. */
  usdAmount: number;
  /** Whether a local (non-USD) currency was applied. */
  isLocal: boolean;
}

export function resolveLocalizedDonation(p: {
  country: string | null;
  usdAmount: number;
}): LocalizedDonation {
  const usdAmount = p.usdAmount;
  const currency = p.country ? COUNTRY_CURRENCY[p.country] : undefined;
  const rate = currency ? CURRENCY_RATE[currency] : undefined;

  if (currency && currency !== "usd" && rate) {
    const major = roundLocalMajor(currency, usdAmount * rate);
    return {
      currency,
      unitAmount: toMinorUnit(currency, major),
      unitAmountMajor: major,
      usdAmount,
      isLocal: true,
    };
  }

  return {
    currency: "usd",
    unitAmount: Math.round(usdAmount * 100),
    unitAmountMajor: usdAmount,
    usdAmount,
    isLocal: false,
  };
}
