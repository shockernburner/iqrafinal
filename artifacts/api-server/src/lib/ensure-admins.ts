import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Promote a fixed allow-list of existing accounts to the `admin` role on
 * startup. The list is supplied via the `ADMIN_EMAILS` environment variable as
 * a comma-separated list of emails.
 *
 * This is intentionally idempotent and conservative:
 * - It only UPDATEs accounts that already exist and are not already admins.
 * - It NEVER creates users and NEVER touches passwords.
 * - Emails that do not correspond to an existing account are logged and skipped.
 *
 * Because development and production run against separate databases, this runs
 * inside each environment on boot, so a redeploy is what applies the promotion
 * to the production database.
 */
export async function ensureAdmins(): Promise<void> {
  const raw = process.env["ADMIN_EMAILS"];
  if (!raw) return;

  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (emails.length === 0) return;

  const { rows } = await pool.query<{ email: string }>(
    `UPDATE users
       SET role = 'admin'
     WHERE lower(email) = ANY($1::text[])
       AND role <> 'admin'
     RETURNING email`,
    [emails],
  );

  const promoted = rows.map((r) => r.email);
  if (promoted.length > 0) {
    logger.info({ promoted }, "Promoted accounts to admin");
  }

  const { rows: existing } = await pool.query<{ email: string }>(
    `SELECT lower(email) AS email FROM users WHERE lower(email) = ANY($1::text[])`,
    [emails],
  );
  const existingSet = new Set(existing.map((r) => r.email));
  const missing = emails.filter((e) => !existingSet.has(e));
  if (missing.length > 0) {
    logger.warn(
      { missing },
      "ADMIN_EMAILS entries have no matching account; skipped",
    );
  }
}
