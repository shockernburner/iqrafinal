import { Link } from "wouter";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3 px-4">
        <Link href="/corporate-sponsors" className="hover:text-primary hover:underline">Corporate Sponsors</Link>
        <Link href="/donors" className="hover:text-primary hover:underline">Our Donors</Link>
        <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
        <a href="mailto:contact@iqra.live" className="hover:text-primary hover:underline">Contact</a>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} IQRA Assistant
      </p>
    </footer>
  );
}
