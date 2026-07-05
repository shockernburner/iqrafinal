import type { SiteContent, SiteHero, SitePillar, DonationPopup } from "@workspace/api-client-react";
import { useGetSiteContent } from "@workspace/api-client-react";

// Default copy mirrors the original hardcoded landing / vision text so the
// prerendered (SSR, no-fetch) HTML and any pre-load render show real content;
// admin edits saved to `site_content` are merged over these at runtime.
export const DEFAULT_HERO: SiteHero = {
  title: "Wisdom and guidance rooted in tradition",
  subtitle:
    "IQRA Assistant is an Islamic ethics and leadership companion for reflection. Ask questions about character, conduct, and decision-making, and receive answers grounded in traditional texts — not generic chatbot advice.",
};

export const DEFAULT_PILLARS: SitePillar[] = [
  {
    title: "Rooted in tradition",
    body: "Guidance grounded in classical Islamic ethics and leadership texts, not generic advice.",
  },
  {
    title: "Practical direction",
    body: "Ask real questions about character, decision-making, and leadership and receive thoughtful, sourced answers.",
  },
  {
    title: "Careful and consistent",
    body: "A policy-grounded assistant designed to stay faithful to its sources rather than improvise.",
  },
];

export const DEFAULT_VISION_HERO: SiteHero = {
  title: "Grounded Islamic guidance, accessible to every believer",
  subtitle:
    "IQRA exists to make trustworthy, source-grounded guidance on Islamic ethics and leadership available to anyone — from a first question to a lifetime of reflection. Below is where we are headed over the next three years, and how we plan to get there.",
};

export const DEFAULT_POPUP: DonationPopup = {
  title: "Help keep IQRA free for every seeker",
  body: "IQRA was built for people who seek answers the Islamic way. Our aim is to reach every believer in the world and keep growing our knowledge base — which means upgrading servers, GPUs, and infrastructure, and that carries real cost. If this work has value to you, please consider supporting it. Every small donation is sadaqah jāriyah that helps others learn.",
  supportLabel: "Support us",
  laterLabel: "OK, I'll do it later",
};

export const DEFAULT_CONTENT: Required<SiteContent> = {
  hero: DEFAULT_HERO,
  pillars: DEFAULT_PILLARS,
  visionHero: DEFAULT_VISION_HERO,
  popup: DEFAULT_POPUP,
};

export function mergeContent(content: SiteContent | undefined | null): Required<SiteContent> {
  return {
    hero: content?.hero ?? DEFAULT_HERO,
    pillars: content?.pillars && content.pillars.length > 0 ? content.pillars : DEFAULT_PILLARS,
    visionHero: content?.visionHero ?? DEFAULT_VISION_HERO,
    popup: content?.popup ?? DEFAULT_POPUP,
  };
}

export function useSiteContent(): Required<SiteContent> {
  const { data } = useGetSiteContent({
    // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
    query: { retry: false, staleTime: 60_000 },
  });
  return mergeContent(data);
}
