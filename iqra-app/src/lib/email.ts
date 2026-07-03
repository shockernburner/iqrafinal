import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function safeName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return "there";
  return normalized.slice(0, 60);
}

export async function sendWelcomeEmail({ to, name }: { to: string; name?: string | null }) {
  const resend = getResendClient();
  if (!resend) return;

  const from = process.env.EMAIL_WELCOME_FROM ?? "IQRA Team <welcome@iqra.live>";
  const recipientName = safeName(name);

  await resend.emails.send({
    from,
    to,
    subject: "Welcome to IQRA",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Welcome to IQRA</h1>
        <p style="margin:0 0 12px;">Assalamu alaikum ${recipientName},</p>
        <p style="margin:0 0 12px;">
          Thank you for joining IQRA. We are honored to support your journey with practical,
          source-grounded Islamic guidance for modern decisions.
        </p>
        <p style="margin:0 0 12px;">
          You can now sign in and begin your private chat workspace.
        </p>
        <p style="margin:20px 0 0;">Warm regards,<br/>IQRA Team</p>
      </div>
    `,
  });
}

export async function sendDonationThankYou({
  to,
  amountCents,
}: {
  to: string;
  amountCents?: number | null;
}) {
  const resend = getResendClient();
  if (!resend) return;

  const from = process.env.EMAIL_DONATION_FROM ?? "IQRA Team <thankyou@iqra.live>";
  const amount = typeof amountCents === "number" && amountCents > 0
    ? `$${(amountCents / 100).toFixed(2)}`
    : "your donation";

  await resend.emails.send({
    from,
    to,
    subject: "Thank you for supporting IQRA",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;margin:0 auto;padding:24px;">
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">JazakAllahu khairan</h1>
        <p style="margin:0 0 12px;">Thank you for supporting IQRA with ${amount}.</p>
        <p style="margin:0 0 12px;">
          Your contribution helps us maintain and improve access to trustworthy, practical Islamic guidance.
        </p>
        <p style="margin:20px 0 0;">With gratitude,<br/>IQRA Team</p>
      </div>
    `,
  });
}