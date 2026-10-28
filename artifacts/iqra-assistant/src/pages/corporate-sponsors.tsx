import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import logoPng from "@/assets/logo.png";
import { Building2, Loader2, Mail } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import {
  CORPORATE_SPONSORSHIP_MAILTO,
  CorporateSponsorsEmpty,
  SponsorTile,
  useCorporateSponsors,
} from "@/components/corporate-sponsors";
import { PublicFooter } from "@/components/public-footer";

export default function CorporateSponsors() {
  useSeo({
    title: "Our Corporate Sponsors — IQRA Assistant",
    description:
      "The organisations whose sponsorship helps keep IQRA Assistant free for every seeker of Islamic guidance.",
    robots: "index, follow",
    canonicalPath: "/corporate-sponsors",
  });

  const { sponsors, isLoading } = useCorporateSponsors();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-9 h-9 rounded-md shadow-sm" />
          <span className="font-serif text-xl font-bold text-foreground">IQRA Assistant</span>
        </Link>
        <nav className="flex items-center gap-3">
          <a href={CORPORATE_SPONSORSHIP_MAILTO}>
            <Button data-testid="link-nav-corporate-contact">
              <Mail className="w-4 h-4 mr-2" /> Become a sponsor
            </Button>
          </a>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-24">
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Our Corporate Sponsors
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Organisations that stand behind free, source-grounded Islamic guidance. Listed in the order
            they joined us — thank you for your trust and support.
          </p>
        </section>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sponsors.length === 0 ? (
          <CorporateSponsorsEmpty />
        ) : (
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-10" data-testid="list-corporate-sponsors">
            {sponsors.map((sponsor) => (
              <SponsorTile key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Interested in sponsoring IQRA?{" "}
          <a href={CORPORATE_SPONSORSHIP_MAILTO} className="text-primary hover:underline font-medium">
            Contact us at donation@iqra.live
          </a>
          .
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}
