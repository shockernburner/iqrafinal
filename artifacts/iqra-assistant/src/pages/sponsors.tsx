import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { Heart, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useGetSponsors } from "@workspace/api-client-react";
import { countryLabel } from "@/lib/country";

export default function Sponsors() {
  useSeo({
    title: "Our Sponsors — IQRA Assistant",
    description:
      "The generous supporters whose donations keep IQRA Assistant free and growing for every seeker of Islamic guidance.",
    robots: "index, follow",
    canonicalPath: "/sponsors",
  });

  const { data, isLoading } = useGetSponsors();
  const sponsors = data?.sponsors ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-9 h-9 rounded-md shadow-sm" />
          <span className="font-serif text-xl font-bold text-foreground">IQRA Assistant</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/donate">
            <Button data-testid="link-nav-donate">
              <Heart className="w-4 h-4 mr-2" /> Donate
            </Button>
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8 pb-24">
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
            <Heart className="w-8 h-8 fill-primary" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Our Sponsors
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            IQRA is sustained by the generosity of those who believe in accessible, source-grounded
            Islamic guidance. To every supporter — thank you. Your sadaqah jāriyah keeps this work
            alive for seekers everywhere.
          </p>
        </section>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sponsors.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              Be the first to support IQRA.{" "}
              <Link href="/donate" className="text-primary hover:underline font-medium">
                Make a donation
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <ol className="space-y-3" data-testid="list-sponsors">
            {sponsors.map((sponsor, index) => {
              const name = sponsor.anonymous || !sponsor.displayName ? "Anonymous" : sponsor.displayName;
              const country = countryLabel(sponsor.country);
              return (
                <li key={index}>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="flex items-center gap-4 py-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-semibold text-foreground truncate">{name}</p>
                        {country && <p className="text-sm text-muted-foreground">{country}</p>}
                      </div>
                      <Heart className="w-5 h-5 text-primary/40 fill-primary/20 flex-shrink-0" />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
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
