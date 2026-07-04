import { Link } from "wouter";
import logoPng from "@/assets/logo.png";
import { useSeo } from "@/hooks/use-seo";
import { LegalDisclaimerBanner, LegalFooter, LEGAL_LAST_UPDATED } from "@/components/legal-shared";

export default function Terms() {
  useSeo({
    title: "Terms of Service — IQRA Assistant",
    description: "The terms that govern your use of IQRA Assistant.",
    robots: "index, follow",
    canonicalPath: "/terms",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoPng} alt="IQRA Assistant" className="w-8 h-8 rounded-sm object-contain" />
            <span className="font-serif font-semibold text-xl tracking-wide">IQRA</span>
          </Link>
          <Link href="/" className="ml-auto text-sm text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LEGAL_LAST_UPDATED}</p>

        <LegalDisclaimerBanner />

        <div className="prose-legal text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">1. Acceptance of these Terms</h2>
            <p>
              These Terms of Service ("Terms") govern your access to and use of IQRA Assistant
              (the "Service"), operated by IQRA Assistant ("we", "us", or "our"). By creating an
              account, checking the acceptance boxes presented to you, or otherwise using the
              Service, you agree to be bound by these Terms and by our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              If you do not agree, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">2. What the Service is (and is not)</h2>
            <p>
              IQRA Assistant is an educational tool that provides reflections and general guidance
              rooted in traditional Islamic ethics and leadership texts, generated with the help of
              artificial intelligence. It is intended for personal reflection and learning only.
            </p>
            <p className="mt-2 font-medium">
              The Service does not provide religious rulings (fatawa), legal advice, financial
              advice, medical advice, or professional counselling. AI-generated responses may be
              incomplete or inaccurate. For binding religious rulings or any consequential decision,
              consult a qualified scholar or the appropriate licensed professional.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">3. Eligibility and account registration</h2>
            <p>
              You must be at least 13 years old (or the minimum age of digital consent in your
              jurisdiction, if higher) to use the Service. You agree to provide accurate information,
              to keep your password confidential, and to accept responsibility for all activity that
              occurs under your account. Notify us promptly of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful, harmful, deceptive, or abusive purpose;</li>
              <li>Attempt to misrepresent the Service's output as an authoritative religious ruling;</li>
              <li>Scrape, reverse engineer, or attempt to extract the underlying models or source code;</li>
              <li>Interfere with, overload, or disrupt the Service or its infrastructure;</li>
              <li>Upload content that infringes the rights of others or that you have no right to share;</li>
              <li>Attempt to gain unauthorized access to other accounts or to restricted areas.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">5. Your content</h2>
            <p>
              You retain ownership of the messages and content you submit ("User Content"). You grant
              us a limited licence to process and store your User Content solely to operate, secure,
              and improve the Service. You are responsible for your User Content and for ensuring you
              have the right to submit it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">6. Donations</h2>
            <p>
              The Service may allow you to make voluntary donations, processed by our third-party
              payment provider. Donations are voluntary and, unless required by law, non-refundable.
              We do not store your full payment card details.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">7. Intellectual property</h2>
            <p>
              The Service, including its name, branding, design, and software, is owned by us and
              protected by applicable intellectual property laws. Except for the rights expressly
              granted to you here, no rights are transferred to you.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">8. Service availability</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis. We do not guarantee
              that it will be uninterrupted, error-free, or that any response will be accurate or
              suitable for your purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">9. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, we will not be liable for any indirect,
              incidental, special, or consequential damages, or for any decisions you make in
              reliance on the Service. Nothing in these Terms limits liability that cannot be limited
              under applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">10. Termination</h2>
            <p>
              You may stop using the Service and request deletion of your account at any time by
              contacting us. We may suspend or terminate access if you violate these Terms or to
              protect the Service and its users.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">11. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              update the "Last updated" date and may require you to re-accept the updated Terms the
              next time you use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">12. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:contact@iqra.live" className="text-primary hover:underline">
                contact@iqra.live
              </a>.
            </p>
          </section>
        </div>

        <LegalFooter />
      </main>
    </div>
  );
}
