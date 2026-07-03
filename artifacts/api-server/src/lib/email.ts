import { Resend } from "resend";
import { logger } from "./logger";

let client: Resend | null | undefined;

function getClient(): Resend | null {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  client = apiKey ? new Resend(apiKey) : null;
  return client;
}

async function sendEmail(options: { from: string; to: string; subject: string; html: string }) {
  const resend = getClient();
  if (!resend) {
    logger.warn({ to: options.to, subject: options.subject }, "RESEND_API_KEY not set; skipping email send");
    return;
  }
  try {
    const result = await resend.emails.send(options);
    if (result.error) {
      logger.error({ err: result.error, to: options.to, subject: options.subject }, "Failed to send email");
    } else {
      logger.info({ id: result.data?.id, to: options.to, subject: options.subject }, "Email sent");
    }
  } catch (error) {
    logger.error({ err: error, to: options.to, subject: options.subject }, "Failed to send email");
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const from = process.env.RESEND_FROM_WELCOME_EMAIL;
  if (!from) {
    logger.warn({ to }, "RESEND_FROM_WELCOME_EMAIL not set; skipping welcome email");
    return;
  }
  await sendEmail({
    from,
    to,
    subject: "Welcome to IQRA Assistant",
    html: `
      <p>Assalamu alaikum ${escapeHtml(name)},</p>
      <p>Your IQRA Assistant account has been created. You can now sign in and start a conversation grounded in traditional Islamic ethics and leadership guidance.</p>
      <p>This is an automated, no-reply message.</p>
    `.trim(),
  });
}

export async function sendDonationThankYouEmail(to: string, amountCents: number) {
  const from = process.env.RESEND_FROM_DONATION_EMAIL;
  if (!from) {
    logger.warn({ to }, "RESEND_FROM_DONATION_EMAIL not set; skipping donation thank-you email");
    return;
  }
  const amount = (amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  await sendEmail({
    from,
    to,
    subject: "Thank you for supporting IQRA Assistant",
    html: `
      <p>Jazakumullahu khairan for your donation of ${amount}.</p>
      <p>Your support helps keep IQRA Assistant available and growing.</p>
      <p>This is an automated, no-reply message.</p>
    `.trim(),
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
