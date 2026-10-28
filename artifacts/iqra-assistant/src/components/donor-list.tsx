import type { Donor } from "@workspace/api-client-react";
import { Heart } from "lucide-react";
import { countryLabel } from "@/lib/country";

// Donors in first-come order, numbered, flowing down a two-column list
// (left column first, then right) on wider screens.
export function DonorList({ donors, testId }: { donors: Donor[]; testId?: string }) {
  return (
    <ol className="sm:columns-2 sm:gap-x-6" data-testid={testId}>
      {donors.map((donor, index) => {
        const name = donor.anonymous || !donor.displayName ? "Anonymous" : donor.displayName;
        const country = countryLabel(donor.country);
        return (
          <li
            key={index}
            className="break-inside-avoid mb-3 flex items-center gap-4 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm tabular-nums">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-serif font-semibold text-foreground truncate">{name}</p>
              {country && <p className="text-sm text-muted-foreground truncate">{country}</p>}
            </div>
            <Heart className="w-5 h-5 text-primary/40 fill-primary/20 flex-shrink-0" />
          </li>
        );
      })}
    </ol>
  );
}
