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

const APP_URL = "https://iqra.live";
const BRAND_GREEN = "#103D2B";
const BRAND_CREAM = "#F7F4EC";
const BRAND_GOLD = "#C9A227";

function emailLayout(options: { preheader: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${BRAND_CREAM};font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d5;">
          <tr>
            <td style="background-color:${BRAND_GREEN};padding:28px 40px;text-align:center;">
              <img src="${APP_URL}/favicon.png" width="48" height="48" alt="IQRA" style="display:inline-block;border-radius:8px;" />
              <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;margin-top:12px;">IQRA Assistant</div>
              <div style="color:${BRAND_GOLD};font-size:13px;margin-top:4px;font-style:italic;">Wisdom and guidance rooted in tradition</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;color:#2b2b2b;font-size:16px;line-height:1.7;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:${BRAND_CREAM};border-top:1px solid #e5e0d5;text-align:center;">
              <div style="color:#6b6b5f;font-size:12px;line-height:1.6;">
                IQRA Assistant &middot; <a href="${APP_URL}" style="color:${BRAND_GREEN};text-decoration:none;">iqra.live</a><br />
                This is an automated message; replies to this address are not monitored.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;"><tr>
    <td style="background-color:${BRAND_GREEN};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</a>
    </td>
  </tr></table>`;
}

export function renderWelcomeEmailHtml(name: string) {
  return emailLayout({
      preheader: "Your account is ready — start a conversation grounded in traditional Islamic guidance.",
      bodyHtml: `
        <p style="margin:0 0 16px;">Assalamu alaikum ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;">Welcome to IQRA Assistant. Your account has been created, and your personal chat is ready whenever you are.</p>
        <p style="margin:0 0 16px;">Ask about ethics, leadership, and daily conduct — every answer is grounded in traditional Islamic texts and scholarship.</p>
        <div style="text-align:center;">${ctaButton("Start a Conversation", APP_URL)}</div>
        <p style="margin:24px 0 0;color:#6b6b5f;font-size:14px;">May your journey of reflection be a source of benefit.</p>
      `.trim(),
  });
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
    html: renderWelcomeEmailHtml(name),
  });
}

export function renderDonationThankYouEmailHtml(amountCents: number) {
  const amount = (amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return emailLayout({
      preheader: `Jazakumullahu khairan — your gift of ${amount} was received.`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Assalamu alaikum,</p>
        <p style="margin:0 0 16px;">Jazakumullahu khairan for your generous donation.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td style="background-color:${BRAND_CREAM};border:1px solid #e5e0d5;border-radius:8px;padding:20px;text-align:center;">
              <div style="color:#6b6b5f;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Donation received</div>
              <div style="color:${BRAND_GREEN};font-size:30px;font-weight:bold;margin-top:6px;">${escapeHtml(amount)}</div>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 16px;">Your support keeps IQRA Assistant available and growing — helping more people find guidance rooted in traditional knowledge.</p>
        <p style="margin:24px 0 0;color:#6b6b5f;font-size:14px;">"The believer's shade on the Day of Resurrection will be their charity." — Tirmidhi</p>
      `.trim(),
  });
}

export async function sendDonationThankYouEmail(to: string, amountCents: number) {
  const from = process.env.RESEND_FROM_DONATION_EMAIL;
  if (!from) {
    logger.warn({ to }, "RESEND_FROM_DONATION_EMAIL not set; skipping donation thank-you email");
    return;
  }
  await sendEmail({
    from,
    to,
    subject: "Thank you for supporting IQRA Assistant",
    html: renderDonationThankYouEmailHtml(amountCents),
  });
}

export function renderPasswordResetEmailHtml(name: string, resetUrl: string) {
  return emailLayout({
      preheader: "Reset your IQRA Assistant password — this link expires in 1 hour.",
      bodyHtml: `
        <p style="margin:0 0 16px;">Assalamu alaikum ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;">We received a request to reset the password for your IQRA Assistant account. Choose a new password using the button below. For your security, this link expires in one hour.</p>
        <div style="text-align:center;">${ctaButton("Reset Password", resetUrl)}</div>
        <p style="margin:24px 0 0;color:#6b6b5f;font-size:14px;">If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
      `.trim(),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const from = process.env.RESEND_FROM_PASSWORD_RESET || process.env.RESEND_FROM_WELCOME_EMAIL;
  if (!from) {
    logger.warn(
      { to },
      "No password-reset from address (RESEND_FROM_PASSWORD_RESET / RESEND_FROM_WELCOME_EMAIL) set; skipping password reset email",
    );
    return;
  }
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    from,
    to,
    subject: "Reset your IQRA Assistant password",
    html: renderPasswordResetEmailHtml(name, resetUrl),
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
