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

// Codes the browser knows a region name for but that aren't real countries.
const NON_COUNTRY_CODES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "XK", "ZZ"]);
let cachedOptions: Array<{ code: string; label: string }> | null = null;

/** All ISO 3166-1 alpha-2 countries the browser can name, sorted by name. */
export function countryOptions(): Array<{ code: string; label: string }> {
  if (cachedOptions) return cachedOptions;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  } catch {
    return [];
  }
  const options: Array<{ code: string; label: string }> = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (NON_COUNTRY_CODES.has(code)) continue;
      const name = names.of(code);
      if (name && name !== code) options.push({ code, label: `${countryFlag(code)} ${name}` });
    }
  }
  options.sort((x, y) => x.label.replace(/^\S+\s/, "").localeCompare(y.label.replace(/^\S+\s/, "")));
  cachedOptions = options;
  return options;
}
