export const MAX_LOGO_BYTES = 1024 * 1024;

/** Public URL the frontend uses as the <img src> for a sponsor's logo. */
export function corporateSponsorLogoUrl(id: string) {
  return `/api/corporate-sponsors/${id}/logo`;
}

/**
 * Identify the logo format from its magic bytes rather than the client-supplied
 * MIME type. SVG is deliberately not accepted: it can carry script and would be
 * served from our own origin.
 */
export function detectLogoMime(buffer: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
