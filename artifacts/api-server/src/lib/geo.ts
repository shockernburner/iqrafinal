import { logger } from "./logger";

/**
 * Best-effort client IP extraction from proxy headers. Replit's deployment
 * proxy sets `x-forwarded-for`; the left-most entry is the original client.
 */
export function getClientIp(headers: Record<string, unknown>): string | null {
  const xff = headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0]!.trim();
  }
  const real = headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real.trim();
  return null;
}

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/i;

/**
 * Best-effort IP → ISO alpha-2 country code. Used only as a supplement to the
 * Stripe billing-address country; failures are swallowed and return null so a
 * geolocation outage never blocks a donation.
 */
export async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip || PRIVATE_IP.test(ip)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status === "success" && data.countryCode) {
      return data.countryCode.toUpperCase();
    }
    return null;
  } catch (err) {
    logger.warn({ err }, "IP geolocation lookup failed");
    return null;
  }
}
