import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { BookOpen, Compass, ShieldCheck, Eye, Users, Heart, Building2, Mail } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { HomeStructuredData } from "@/components/structured-data";
import { useSiteContent } from "@/lib/site-content";
import {
  useGetSiteStats,
  useGetDonors,
  recordVisit,
  getGetSiteStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DonorList } from "@/components/donor-list";
import { PublicFooter } from "@/components/public-footer";
import {
  CORPORATE_SPONSORSHIP_MAILTO,
  CorporateSponsorsEmpty,
  CorporateSponsorsMarquee,
  useCorporateSponsors,
} from "@/components/corporate-sponsors";

const PILLAR_ICONS = [BookOpen, Compass, ShieldCheck];
const VISIT_KEY = "iqra-visit-counted";

function StatsBar() {
  const queryClient = useQueryClient();
  const { data } = useGetSiteStats({
    // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
    query: { retry: false },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(VISIT_KEY) === "1") return;
    sessionStorage.setItem(VISIT_KEY, "1");
    recordVisit()
      .then(() => queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() }))
      .catch(() => {});
  }, [queryClient]);

  const visits = data?.pageVisits ?? 0;
  const members = data?.registeredUsers ?? 0;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      <div
        className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-card px-5 py-2.5 shadow-sm"
        data-testid="stat-page-visits"
      >
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {visits.toLocaleString()}
          </span>{" "}
          total visits
        </span>
      </div>
      <div
        className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-card px-5 py-2.5 shadow-sm"
        data-testid="stat-registered-users"
      >
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {members.toLocaleString()}
          </span>{" "}
          registered {members === 1 ? "member" : "members"}
        </span>
      </div>
    </div>
  );
}

const DONOR_PREVIEW_COUNT = 10;

function CorporateSponsorsSection() {
  const { sponsors, isLoading } = useCorporateSponsors();
  if (isLoading) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 pb-20" aria-labelledby="corporate-sponsors-heading">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 id="corporate-sponsors-heading" className="font-serif text-3xl font-bold text-foreground">
          Our Corporate Sponsors
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Organisations helping us keep authentic, source-grounded guidance free for everyone.
        </p>
      </div>
      {sponsors.length > 0 ? <CorporateSponsorsMarquee sponsors={sponsors} /> : <CorporateSponsorsEmpty />}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {sponsors.length > 0 && (
          <Link href="/corporate-sponsors">
            <Button variant="outline" data-testid="link-view-all-corporate-sponsors">View all sponsors</Button>
          </Link>
        )}
        <a href={CORPORATE_SPONSORSHIP_MAILTO}>
          <Button variant={sponsors.length > 0 ? "ghost" : "default"} data-testid="link-corporate-contact">
            <Mail className="w-4 h-4 mr-2" /> Contact for corporate sponsorship
          </Button>
        </a>
      </div>
    </section>
  );
}

function DonorsPreview() {
  const { data } = useGetDonors({
    // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
    query: { retry: false },
  });
  const donors = data?.donors ?? [];

  if (donors.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 pb-24" aria-labelledby="donors-heading">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4">
          <Heart className="w-6 h-6 fill-primary" />
        </div>
        <h2 id="donors-heading" className="font-serif text-3xl font-bold text-foreground">Our Donors</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Generous supporters whose sadaqah jāriyah keeps IQRA free for every seeker.
        </p>
      </div>
      <DonorList donors={donors.slice(0, DONOR_PREVIEW_COUNT)} testId="list-donors-preview" />
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/donors">
          <Button variant="outline" data-testid="link-view-all-donors">
            {donors.length > DONOR_PREVIEW_COUNT ? `View all ${donors.length} donors` : "View all donors"}
          </Button>
        </Link>
        <Link href="/donate">
          <Button data-testid="link-donors-donate">
            <Heart className="w-4 h-4 mr-2" /> Become a donor
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { hero, pillars } = useSiteContent();

  useSeo({
    title: "IQRA Assistant — Islamic Ethics & Leadership Guidance",
    description:
      "IQRA Assistant offers wisdom and guidance rooted in traditional Islamic texts on ethics and leadership. Sign in or create a free account to start reflecting.",
    robots: "index, follow",
    canonicalPath: "/",
  });

  return (
    <div className="min-h-screen bg-background">
      <HomeStructuredData />
      <header className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-9 h-9 rounded-md shadow-sm" />
          <span className="font-serif text-xl font-bold text-foreground">IQRA Assistant</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/donors">
            <Button variant="ghost" data-testid="link-nav-donors">Our Donors</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" data-testid="link-nav-login">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button data-testid="link-nav-register">Create account</Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
            {hero.title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="font-medium" data-testid="link-hero-register">
                Start reflecting — it's free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="font-medium" data-testid="link-hero-login">
                Sign in
              </Button>
            </Link>
          </div>
          <StatsBar />
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-6 sm:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length];
            return (
              <Card key={pillar.title} className="border-border/50 shadow-sm">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-2">{pillar.title}</h2>
                  <p className="text-sm text-muted-foreground">{pillar.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <CorporateSponsorsSection />
        <DonorsPreview />
      </main>

      <PublicFooter />
    </div>
  );
}
