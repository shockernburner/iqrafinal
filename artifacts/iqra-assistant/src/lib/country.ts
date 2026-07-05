// Turn an ISO 3166-1 alpha-2 country code into a display name + flag emoji.
// Falls back gracefully when the code is missing or unrecognized.
let displayNames: Intl.DisplayNames | null = null;
function getDisplayNames(): Intl.DisplayNames | null {
  if (displayNames) return displayNames;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    displayNames = null;
  }
  return displayNames;
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    ...[...upper].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)),
  );
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  const upper = code.toUpperCase();
  try {
    return getDisplayNames()?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

export function countryLabel(code: string | null | undefined): string {
  const flag = countryFlag(code);
  const name = countryName(code);
  if (flag && name) return `${flag} ${name}`;
  return name || flag || "";
}
