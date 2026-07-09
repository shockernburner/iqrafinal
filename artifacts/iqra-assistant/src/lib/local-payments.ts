/**
 * Client-side localized payments + donation display.
 *
 * Detects the donor's country from the device timezone (instant, offline, no
 * permission prompt) and:
 *   1. lists the local Stripe payment methods available in that country, and
 *   2. converts a USD donation amount into a clean local-currency estimate.
 *
 * The country code is also sent to the server as a checkout hint so the Stripe
 * session is created in the local currency (which is what actually unlocks the
 * local payment methods).
 *
 * LOCKSTEP: COUNTRY_CURRENCY, CURRENCY_RATE and roundLocalMajor MUST match the
 * server (artifacts/api-server/src/lib/pricing.ts) exactly, or the amount shown
 * here won't match the amount charged. Only list a method in COUNTRY_METHODS
 * once it is actually enabled in the Stripe dashboard.
 */

// --- Pricing (mirror of server) -------------------------------------------

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx",
  "vnd", "vuv", "xaf", "xof", "xpf",
]);

const CURRENCY_RATE: Record<string, number> = {
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

const COUNTRY_CURRENCY: Record<string, string> = {
  IN: "inr",
  BR: "brl",
  SG: "sgd",
  MY: "myr",
  PL: "pln",
  KR: "krw",
  CN: "cny",
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

function roundLocalMajor(currency: string, raw: number): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return Math.max(100, Math.round(raw / 100) * 100);
  if (currency === "inr") return Math.max(10, Math.round(raw / 10) * 10);
  return Math.max(1, Math.round(raw));
}

// How each currency renders (symbol + locale). UI only.
const CURRENCY_FORMAT: Record<string, (n: number) => string> = {
  usd: (n) => "$" + n.toLocaleString("en-US"),
  inr: (n) => "₹" + n.toLocaleString("en-IN"),
  brl: (n) => "R$" + n.toLocaleString("pt-BR"),
  sgd: (n) => "S$" + n.toLocaleString("en-SG"),
  myr: (n) => "RM" + n.toLocaleString("ms-MY"),
  pln: (n) => n.toLocaleString("pl-PL") + " zł",
  eur: (n) => "€" + n.toLocaleString("de-DE"),
  krw: (n) => "₩" + n.toLocaleString("ko-KR"),
  cny: (n) => "¥" + n.toLocaleString("zh-CN"),
};

// --- Country detection + methods ------------------------------------------

const TZ_COUNTRY: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "America/Sao_Paulo": "BR",
  "America/Bahia": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Manaus": "BR",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Kuching": "MY",
  "Europe/Warsaw": "PL",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Urumqi": "CN",
  "Europe/Vienna": "AT",
  "Europe/Brussels": "BE",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Helsinki": "FI",
  "Europe/Paris": "FR",
  "Europe/Dublin": "IE",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Lisbon": "PT",
};

interface CountryMethods {
  name: string;
  flag: string;
  methods: string[];
}

// Only methods currently ENABLED in the Stripe dashboard for each market.
const COUNTRY_METHODS: Record<string, CountryMethods> = {
  IN: { name: "India", flag: "🇮🇳", methods: ["UPI", "Google Pay", "Cards"] },
  BR: { name: "Brazil", flag: "🇧🇷", methods: ["Pix", "Cards"] },
  SG: { name: "Singapore", flag: "🇸🇬", methods: ["PayNow", "GrabPay", "Cards"] },
  MY: { name: "Malaysia", flag: "🇲🇾", methods: ["GrabPay", "Cards"] },
  PL: { name: "Poland", flag: "🇵🇱", methods: ["BLIK", "Cards"] },
  KR: { name: "South Korea", flag: "🇰🇷", methods: ["Naver Pay", "Samsung Pay", "Cards"] },
  CN: { name: "China", flag: "🇨🇳", methods: ["Alipay", "Cards"] },
  AT: { name: "Austria", flag: "🇦🇹", methods: ["EPS", "Cards"] },
  BE: { name: "Belgium", flag: "🇧🇪", methods: ["Bancontact", "Cards"] },
  PT: { name: "Portugal", flag: "🇵🇹", methods: ["MB WAY", "Cards"] },
  DE: { name: "Germany", flag: "🇩🇪", methods: ["Cards"] },
  ES: { name: "Spain", flag: "🇪🇸", methods: ["Cards"] },
  FI: { name: "Finland", flag: "🇫🇮", methods: ["Cards"] },
  FR: { name: "France", flag: "🇫🇷", methods: ["Cards"] },
  IE: { name: "Ireland", flag: "🇮🇪", methods: ["Cards"] },
  IT: { name: "Italy", flag: "🇮🇹", methods: ["Cards"] },
  NL: { name: "Netherlands", flag: "🇳🇱", methods: ["Cards"] },
};

// Wallets Stripe enables in all regions (browser-gated at checkout).
const GLOBAL_WALLETS = ["Apple Pay", "Google Pay", "Link"];

export interface LocalPayments {
  countryCode: string | null;
  countryName: string | null;
  flag: string;
  currency: string;
  methods: string[];
  isLocal: boolean;
}

const DEFAULT_PAYMENTS: LocalPayments = {
  countryCode: null,
  countryName: null,
  flag: "🌍",
  currency: "usd",
  methods: dedupe(["Cards", ...GLOBAL_WALLETS]),
  isLocal: false,
};

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

function detectCountry(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (tz && TZ_COUNTRY[tz]) || null;
  } catch {
    return null;
  }
}

export function getLocalPayments(): LocalPayments {
  const code = detectCountry();
  const entry = code ? COUNTRY_METHODS[code] : undefined;
  if (!code || !entry) return DEFAULT_PAYMENTS;

  const currency = COUNTRY_CURRENCY[code] ?? "usd";
  return {
    countryCode: code,
    countryName: entry.name,
    flag: entry.flag,
    currency,
    methods: dedupe([...entry.methods, ...GLOBAL_WALLETS]),
    isLocal: currency !== "usd" && !!CURRENCY_RATE[currency],
  };
}

export interface DisplayDonation {
  currency: string;
  amountMajor: number;
  formatted: string;
  isLocal: boolean;
}

/** Convert a USD donation amount into a clean local-currency estimate. */
export function getDisplayDonation(usdAmount: number, countryCode?: string | null): DisplayDonation {
  const code = countryCode ?? detectCountry();
  const currency = code ? COUNTRY_CURRENCY[code] : undefined;
  const rate = currency ? CURRENCY_RATE[currency] : undefined;
  const format = (cur: string, n: number) => (CURRENCY_FORMAT[cur] ?? CURRENCY_FORMAT.usd)(n);

  if (currency && currency !== "usd" && rate) {
    const amountMajor = roundLocalMajor(currency, usdAmount * rate);
    return { currency, amountMajor, formatted: format(currency, amountMajor), isLocal: true };
  }

  return { currency: "usd", amountMajor: usdAmount, formatted: format("usd", usdAmount), isLocal: false };
}
