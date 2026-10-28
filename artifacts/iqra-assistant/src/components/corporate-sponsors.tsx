import { useLayoutEffect, useRef, useState } from "react";
import { useGetCorporateSponsors, type CorporateSponsor } from "@workspace/api-client-react";
import { Building2 } from "lucide-react";

export const CORPORATE_SPONSORSHIP_MAILTO =
  "mailto:donation@iqra.live?subject=" + encodeURIComponent("Corporate Sponsorship — IQRA Assistant");

// Marquee speed in pixels per second, so long and short rows move at the same pace.
const MARQUEE_SPEED_PX_PER_S = 40;
const ITEM_GAP_PX = 48;

export function useCorporateSponsors() {
  const { data, isLoading } = useGetCorporateSponsors({
    // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
    query: { retry: false },
  });
  return { sponsors: data?.sponsors ?? [], isLoading };
}

export function SponsorTile({ sponsor }: { sponsor: CorporateSponsor }) {
  const content = (
    <>
      <div className="h-20 w-40 flex items-center justify-center rounded-lg bg-white border border-border/50 shadow-sm p-3">
        <img
          src={sponsor.logoUrl}
          alt={`${sponsor.name} logo`}
          loading="lazy"
          draggable={false}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <span className="mt-3 max-w-40 text-center text-sm font-medium text-foreground leading-snug line-clamp-2">
        {sponsor.name}
      </span>
    </>
  );
  const className = "flex flex-col items-center shrink-0 w-40";
  return sponsor.websiteUrl ? (
    <a
      href={sponsor.websiteUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`${className} group hover:opacity-90 transition-opacity`}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

/**
 * Sponsors in first-come order. When one row of logos is wider than the
 * available space it becomes a right-to-left marquee; otherwise the logos sit
 * centred and still. Measured live, so it adapts to screen width and count.
 */
export function CorporateSponsorsMarquee({ sponsors }: { sponsors: CorporateSponsor[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;
    const update = () => {
      const width = measure.scrollWidth;
      setRowWidth(width);
      setOverflowing(width > container.clientWidth);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [sponsors]);

  const row = (hidden: boolean) => (
    <div
      className="flex shrink-0 items-start"
      style={{ gap: ITEM_GAP_PX, paddingRight: ITEM_GAP_PX }}
      aria-hidden={hidden || undefined}
    >
      {sponsors.map((sponsor) => (
        <SponsorTile key={sponsor.id} sponsor={sponsor} />
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full" data-testid="corporate-sponsors">
      {/* Invisible copy used only to measure the natural width of one row. */}
      <div ref={measureRef} className="absolute invisible pointer-events-none flex w-max" aria-hidden="true">
        {row(true)}
      </div>

      {overflowing ? (
        <div className="iqra-marquee overflow-hidden py-2" data-testid="corporate-sponsors-marquee">
          <div
            className="iqra-marquee-track flex w-max"
            style={{ ["--iqra-marquee-duration" as string]: `${Math.max(rowWidth / MARQUEE_SPEED_PX_PER_S, 10)}s` }}
          >
            {row(false)}
            {row(true)}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 py-2" data-testid="corporate-sponsors-static">
          {sponsors.map((sponsor) => (
            <SponsorTile key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CorporateSponsorsEmpty() {
  return (
    <div className="flex flex-col items-center text-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-10">
      <Building2 className="w-8 h-8 text-primary/60 mb-3" />
      <p className="text-muted-foreground max-w-md">
        Your organisation could be the first to sponsor IQRA and help keep authentic guidance free for everyone.
      </p>
    </div>
  );
}
