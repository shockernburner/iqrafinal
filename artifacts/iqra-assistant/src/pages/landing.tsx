import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { BookOpen, Compass, ShieldCheck, Eye, Users } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { HomeStructuredData } from "@/components/structured-data";
import { useSiteContent } from "@/lib/site-content";
import {
  useGetSiteStats,
  recordVisit,
  getGetSiteStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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

  return (
    <div className="mt-10 flex items-center justify-center">
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
    </div>
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
          <Link href="/our-vision">
            <Button variant="ghost" data-testid="link-nav-vision">Our Vision</Button>
          </Link>
          <Link href="/sponsors">
            <Button variant="ghost" data-testid="link-nav-sponsors">Our Sponsors</Button>
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
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
          <Link href="/our-vision" className="hover:text-primary hover:underline">Our Vision</Link>
          <Link href="/sponsors" className="hover:text-primary hover:underline">Our Sponsors</Link>
          <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
          <a href="mailto:contact@iqra.live" className="hover:text-primary hover:underline">Contact</a>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} IQRA Assistant
        </p>
      </footer>
    </div>
  );
}
