import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { useSeo } from "@/hooks/use-seo";
import { VisionStructuredData } from "@/components/structured-data";
import {
  BookOpen,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const HORIZONS = [
  {
    icon: BookOpen,
    year: "Year 1 — Foundation",
    title: "Deepen the knowledge base",
    body: "Expand our corpus of classical and contemporary Islamic texts, refine retrieval quality, and ship in Arabic alongside English. Grow an engaged, trusting community of daily reflectors.",
  },
  {
    icon: Globe2,
    year: "Year 2 — Reach",
    title: "Localise across the ummah",
    body: "Launch tailored experiences for the Gulf/MENA and Southeast Asia, with region-aware content, local languages (Arabic, Malay, Bahasa Indonesia), and partnerships with mosques and institutions.",
  },
  {
    icon: GraduationCap,
    year: "Year 3 — Depth",
    title: "From companion to platform",
    body: "Introduce guided learning journeys, scholar-reviewed pathways, and an institutional offering for schools, universities, and Islamic organisations — turning reflection into structured growth.",
  },
];

type Row = {
  label: string;
  y1: string;
  y2: string;
  y3: string;
  emphasis?: boolean;
  muted?: boolean;
};

const PROJECTION: Row[] = [
  { label: "Registered users", y1: "25,000", y2: "150,000", y3: "600,000" },
  { label: "Monthly active users", y1: "8,000", y2: "55,000", y3: "240,000" },
  { label: "Supporters / donors", y1: "600", y2: "4,500", y3: "18,000" },
  { label: "Premium subscribers", y1: "300", y2: "3,200", y3: "16,000" },
  { label: "Institutional partners", y1: "2", y2: "12", y3: "40" },
  {
    label: "Revenue — donations (sadaqah)",
    y1: "$30,000",
    y2: "$180,000",
    y3: "$620,000",
    muted: true,
  },
  {
    label: "Revenue — premium subscriptions",
    y1: "$18,000",
    y2: "$210,000",
    y3: "$1,050,000",
    muted: true,
  },
  {
    label: "Revenue — institutional licensing",
    y1: "$12,000",
    y2: "$120,000",
    y3: "$480,000",
    muted: true,
  },
  {
    label: "Grants & non-dilutive",
    y1: "$60,000",
    y2: "$150,000",
    y3: "$250,000",
    muted: true,
  },
  {
    label: "Total revenue",
    y1: "$120,000",
    y2: "$660,000",
    y3: "$2,400,000",
    emphasis: true,
  },
  { label: "Operating costs", y1: "$260,000", y2: "$780,000", y3: "$1,950,000", muted: true },
  {
    label: "Net (before/after break-even)",
    y1: "−$140,000",
    y2: "−$120,000",
    y3: "+$450,000",
    emphasis: true,
  },
];

const EXPANSION = [
  {
    icon: Globe2,
    title: "Gulf & MENA",
    body: "Arabic-first experience, alignment with Vision 2030-era knowledge initiatives, and partnerships with foundations, awqaf, and Islamic institutions across the UAE, Saudi Arabia, and Qatar.",
  },
  {
    icon: Sparkles,
    title: "Southeast Asia",
    body: "Malay and Bahasa Indonesia localisation for the world's largest Muslim populations, working with Islamic-economy accelerators and community networks in Malaysia and Indonesia.",
  },
  {
    icon: HeartHandshake,
    title: "Institutions & education",
    body: "A licensed offering for Islamic schools, universities, and organisations — a trusted, sourced companion for students, teachers, and community leaders.",
  },
  {
    icon: Rocket,
    title: "Product depth",
    body: "Guided learning journeys, scholar-reviewed pathways, voice interaction, and offline-friendly PWA reach so anyone, anywhere, can access grounded guidance.",
  },
];

export default function OurVision() {
  useSeo({
    title: "Our Vision — IQRA Assistant",
    description:
      "IQRA Assistant's vision, illustrative three-year growth model, and expansion plan across the Gulf, MENA, and Southeast Asia.",
    robots: "index, follow",
    canonicalPath: "/our-vision",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <VisionStructuredData />
      <header className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-9 h-9 rounded-md shadow-sm" />
          <span className="font-serif text-xl font-bold text-foreground">IQRA Assistant</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" data-testid="link-nav-login">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button data-testid="link-nav-register">Create account</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-10 pb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <TrendingUp className="w-4 h-4" /> Our Vision
          </span>
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Grounded Islamic guidance, accessible to every believer
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            IQRA exists to make trustworthy, source-grounded guidance on Islamic ethics
            and leadership available to anyone — from a first question to a lifetime of
            reflection. Below is where we are headed over the next three years, and how
            we plan to get there.
          </p>
        </section>

        {/* Three horizons */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">Three horizons</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {HORIZONS.map(({ icon: Icon, year, title, body }) => (
              <Card key={year} className="border-border/50 shadow-sm">
                <CardContent className="pt-6">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                    {year}
                  </p>
                  <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Illustrative projection */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold">Illustrative three-year model</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">
              A blended, mission-aligned model combining voluntary donations (sadaqah),
              optional premium features, institutional licensing, and non-dilutive grants —
              designed to reach sustainability while keeping core access free.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Illustrative three-year projection of IQRA Assistant users, supporters,
                  revenue streams, operating costs, and net position across Year 1, Year 2, and Year 3.
                </caption>
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left font-semibold px-4 py-3">Metric</th>
                    <th className="text-right font-semibold px-4 py-3">Year 1</th>
                    <th className="text-right font-semibold px-4 py-3">Year 2</th>
                    <th className="text-right font-semibold px-4 py-3">Year 3</th>
                  </tr>
                </thead>
                <tbody>
                  {PROJECTION.map((row) => (
                    <tr
                      key={row.label}
                      className={
                        "border-t border-border/50 " +
                        (row.emphasis
                          ? "bg-primary/5 font-semibold"
                          : row.muted
                          ? "bg-muted/30"
                          : "")
                      }
                    >
                      <td className="text-left px-4 py-2.5">{row.label}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{row.y1}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{row.y2}</td>
                      <td className="text-right px-4 py-2.5 tabular-nums">{row.y3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground italic text-center max-w-2xl mx-auto">
            These figures are an illustrative planning scenario, not a forecast or a
            guarantee. They are provided to communicate direction and intended unit
            economics, and are subject to change as the project develops.
          </p>
        </section>

        {/* Expansion plan */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">Expansion plan</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {EXPANSION.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-border/50 shadow-sm">
                <CardContent className="pt-6 flex gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-12">
            <h2 className="font-serif text-2xl font-bold">Be part of the journey</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Whether you reflect with IQRA daily, support it as a donor, or partner with
              us to reach your community — you help keep grounded Islamic guidance free and
              accessible for all.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="font-medium" data-testid="link-vision-register">
                  Start reflecting — it's free
                </Button>
              </Link>
              <Link href="/donate">
                <Button size="lg" variant="outline" className="font-medium" data-testid="link-vision-donate">
                  Support IQRA
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
          <Link href="/our-vision" className="hover:text-primary hover:underline">Our Vision</Link>
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
