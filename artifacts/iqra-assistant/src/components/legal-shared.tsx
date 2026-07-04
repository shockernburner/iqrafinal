import { Link } from "wouter";

// Kept in sync with the server's CURRENT_LEGAL_VERSION (artifacts/api-server/src/lib/legal.ts).
export const LEGAL_LAST_UPDATED = "July 4, 2026";

export function LegalDisclaimerBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-3 mb-10 text-sm text-amber-800 dark:text-amber-300">
      This document is an informational template and does not constitute legal advice. Please consult
      a qualified attorney for your specific situation.
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="mt-12 pt-6 border-t border-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
      <a href="mailto:contact@iqra.live" className="hover:text-primary hover:underline">Contact</a>
      <Link href="/" className="hover:text-primary hover:underline">Home</Link>
    </footer>
  );
}
