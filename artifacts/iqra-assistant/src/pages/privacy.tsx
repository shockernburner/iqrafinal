import { Link } from "wouter";
import logoPng from "@/assets/logo.png";
import { useSeo } from "@/hooks/use-seo";
import { LegalDisclaimerBanner, LegalFooter, LEGAL_LAST_UPDATED } from "@/components/legal-shared";

export default function Privacy() {
  useSeo({
    title: "Privacy Policy — IQRA Assistant",
    description: "How IQRA Assistant collects, uses, and protects your data.",
    robots: "index, follow",
    canonicalPath: "/privacy",
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
        <h1 className="font-serif text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LEGAL_LAST_UPDATED}</p>

        <LegalDisclaimerBanner />

        <div className="prose-legal text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">1. Who we are</h2>
            <p>
              IQRA Assistant ("we", "us", or "our") operates the IQRA Assistant service. This Privacy
              Policy explains what personal data we collect, how we use it, and the choices you have.
              For any privacy question, contact us at{" "}
              <a href="mailto:contact@iqra.live" className="text-primary hover:underline">
                contact@iqra.live
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">2. What data we collect</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><span className="font-medium">Account information</span> — your name, email address, and a securely hashed password.</li>
              <li><span className="font-medium">Conversations</span> — the messages you send and the responses generated for you, stored so you can revisit your reflections.</li>
              <li><span className="font-medium">Donation information</span> — if you donate, our payment provider processes your payment; we receive confirmation details but not your full card number.</li>
              <li><span className="font-medium">Usage and technical data</span> — basic logs (such as timestamps and error information) needed to operate and secure the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">3. How we use your data</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To provide, maintain, and secure the Service;</li>
              <li>To generate responses to your questions and keep your conversation history;</li>
              <li>To process voluntary donations;</li>
              <li>To send you essential transactional emails (for example, a welcome message or a donation acknowledgement);</li>
              <li>To comply with legal obligations and enforce our Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">4. Third-party processors</h2>
            <p>We rely on a small number of trusted providers who process data on our behalf:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><span className="font-medium">Anthropic (AI, via Replit AI Integrations):</span> receives the content of your messages in order to generate responses. It does not receive your account credentials.</li>
              <li><span className="font-medium">PostgreSQL database host:</span> securely stores your account, conversations, and related records.</li>
              <li><span className="font-medium">Replit (hosting &amp; file storage):</span> runs the application and stores uploaded knowledge-base files.</li>
              <li><span className="font-medium">Stripe (payments):</span> processes donation payments. We do not store your full card details.</li>
              <li><span className="font-medium">Resend (email):</span> delivers transactional emails such as welcome and donation messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">5. Data storage and security</h2>
            <p>
              Data is transmitted over encrypted connections (HTTPS) and stored with access controls.
              Passwords are stored only as salted hashes and are never kept in plain text. No method of
              transmission or storage is completely secure, but we take reasonable measures to protect
              your information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">6. Your rights</h2>
            <p>
              Depending on where you live, you may have the right to access, correct, export, or delete
              your personal data, and to object to or restrict certain processing. To exercise any of
              these rights, contact us at{" "}
              <a href="mailto:contact@iqra.live" className="text-primary hover:underline">
                contact@iqra.live
              </a>. You can also request deletion of your account and associated data.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">7. Cookies</h2>
            <p>
              We use a single essential, httpOnly session cookie to keep you signed in. It is required
              for the Service to function and is not used for advertising or third-party tracking.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">8. Children</h2>
            <p>
              The Service is not directed to children under 13. We do not knowingly collect personal
              data from children under 13. If you believe a child has provided us with personal data,
              contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">9. Data retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the
              Service, and thereafter only as required to comply with legal obligations, resolve
              disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we
              will update the "Last updated" date and may ask you to review and re-accept it the next
              time you use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-2">11. Contact</h2>
            <p>
              For any privacy question or request, email us at{" "}
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
