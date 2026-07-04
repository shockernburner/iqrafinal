import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoPng from "@/assets/logo.png";
import { BookOpen, Compass, ShieldCheck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const PILLARS = [
  {
    icon: BookOpen,
    title: "Rooted in tradition",
    body: "Guidance grounded in classical Islamic ethics and leadership texts, not generic advice.",
  },
  {
    icon: Compass,
    title: "Practical direction",
    body: "Ask real questions about character, decision-making, and leadership and receive thoughtful, sourced answers.",
  },
  {
    icon: ShieldCheck,
    title: "Careful and consistent",
    body: "A policy-grounded assistant designed to stay faithful to its sources rather than improvise.",
  },
];

export default function Landing() {
  useSeo({
    title: "IQRA Assistant — Islamic Ethics & Leadership Guidance",
    description:
      "IQRA Assistant offers wisdom and guidance rooted in traditional Islamic texts on ethics and leadership. Sign in or create a free account to start reflecting.",
    robots: "index, follow",
    canonicalPath: "/",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-9 h-9 rounded-md shadow-sm" />
          <span className="font-serif text-xl font-bold text-foreground">IQRA Assistant</span>
        </div>
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
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
            Wisdom and guidance rooted in tradition
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            IQRA Assistant is an Islamic ethics and leadership companion for reflection.
            Ask questions about character, conduct, and decision-making, and receive
            answers grounded in traditional texts — not generic chatbot advice.
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
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24 grid gap-6 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <Icon className="w-8 h-8 text-primary mb-4" />
                <h2 className="font-serif text-lg font-semibold text-foreground mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
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
