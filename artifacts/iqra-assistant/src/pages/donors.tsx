import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { Heart, Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useGetDonors } from "@workspace/api-client-react";
import { DonorList } from "@/components/donor-list";
import { PublicFooter } from "@/components/public-footer";

export default function Donors() {
  useSeo({
    title: "Our Donors — IQRA Assistant",
    description:
      "The generous donors whose support keeps IQRA Assistant free and growing for every seeker of Islamic guidance.",
    robots: "index, follow",
    canonicalPath: "/donors",
  });

  const { data, isLoading } = useGetDonors();
  const donors = data?.donors ?? [];

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

      <main className="max-w-4xl mx-auto px-6 pt-8 pb-24">
        <section className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
            <Heart className="w-8 h-8 fill-primary" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Our Donors
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            IQRA is sustained by the generosity of those who believe in accessible, source-grounded
            Islamic guidance. To every donor — thank you. Your sadaqah jāriyah keeps this work
            alive for seekers everywhere.
          </p>
        </section>

        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : donors.length === 0 ? (
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
          <DonorList donors={donors} testId="list-donors" />
        )}

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Representing a company?{" "}
          <Link href="/corporate-sponsors" className="text-primary hover:underline font-medium">
            See our corporate sponsors
          </Link>
          .
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}
