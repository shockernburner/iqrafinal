import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";
import { hashPassword, verifyPassword } from "./auth";

// Only these admins may add to the knowledge base, and each must also enter a
// second, upload-only password every time they upload or start a Drive import.
// Every other admin keeps full read access but cannot upload.
export const KB_UPLOAD_ADMIN_EMAILS = new Set(["firdous.mahmood26@gmail.com", "reels.javed@gmail.com"]);

export const KB_UPLOAD_TOKEN_HEADER = "x-kb-upload-token";
export const KB_UPLOAD_MIN_PASSWORD_LENGTH = 12;
const GRANT_TTL_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function isKbUploadEligible(email: string | undefined | null) {
  return !!email && KB_UPLOAD_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hasKbUploadPassword(userId: string) {
  const result = await pool.query("SELECT 1 FROM kb_upload_credentials WHERE user_id = $1", [userId]);
  return (result.rowCount ?? 0) > 0;
}

async function issueGrant(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + GRANT_TTL_MS);
  // Drop this user's stale grants so the table stays small.
  await pool.query(
    "DELETE FROM kb_upload_grants WHERE user_id = $1 AND (used_at IS NOT NULL OR expires_at < now())",
    [userId],
  );
  await pool.query("INSERT INTO kb_upload_grants (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    hashToken(token),
    userId,
    expiresAt.toISOString(),
  ]);
  return { token, expiresAt: expiresAt.toISOString() };
}

type GrantResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; status: number; error: string };

/** First-time setup. Refuses if a password already exists (no silent overwrite). */
export async function setupKbUploadPassword(userId: string, password: string): Promise<GrantResult> {
  if (password.length < KB_UPLOAD_MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: `Upload password must be at least ${KB_UPLOAD_MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const login = await pool.query<{ password_hash: string | null }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId],
  );
  const loginHash = login.rows[0]?.password_hash;
  if (loginHash && (await verifyPassword(password, loginHash))) {
    return { ok: false, status: 400, error: "Choose an upload password different from your sign-in password." };
  }

  const inserted = await pool.query(
    `INSERT INTO kb_upload_credentials (user_id, password_hash) VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, await hashPassword(password)],
  );
  if ((inserted.rowCount ?? 0) === 0) {
    return { ok: false, status: 409, error: "Your upload password is already set. Enter it to continue." };
  }
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1::uuid, 'kb_upload_password_set', 'user', $1::text, '{}'::jsonb)`,
    [userId],
  );

  return { ok: true, ...(await issueGrant(userId)) };
}

export async function verifyKbUploadPassword(userId: string, password: string): Promise<GrantResult> {
  const result = await pool.query<{ password_hash: string; failed_attempts: number; locked_until: Date | null }>(
    "SELECT password_hash, failed_attempts, locked_until FROM kb_upload_credentials WHERE user_id = $1",
    [userId],
  );
  const cred = result.rows[0];
  if (!cred) {
    return { ok: false, status: 409, error: "Set your upload password first." };
  }
  if (cred.locked_until && cred.locked_until.getTime() > Date.now()) {
    const minutes = Math.ceil((cred.locked_until.getTime() - Date.now()) / 60000);
    return {
      ok: false,
      status: 423,
      error: `Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  if (!(await verifyPassword(password, cred.password_hash))) {
    const attempts = cred.failed_attempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;
    await pool.query(
      `UPDATE kb_upload_credentials
       SET failed_attempts = $2, locked_until = $3, updated_at = now() WHERE user_id = $1`,
      [userId, lock ? 0 : attempts, lock ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null],
    );
    await pool.query(
      `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1::uuid, 'kb_upload_password_failed', 'user', $1::text, $2::jsonb)`,
      [userId, JSON.stringify({ locked: lock })],
    );
    return lock
      ? { ok: false, status: 423, error: "Too many incorrect attempts. Uploads are locked for 15 minutes." }
      : { ok: false, status: 400, error: "Incorrect upload password." };
  }

  await pool.query(
    `UPDATE kb_upload_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1`,
    [userId],
  );
  return { ok: true, ...(await issueGrant(userId)) };
}

/**
 * Guards knowledge-base upload routes: the admin must be a designated uploader
 * and present a fresh, unused grant token. The grant is consumed atomically, so
 * each upload/import needs the upload password again. Runs before multer so a
 * rejected request never gets its files buffered.
 */
export async function requireKbUploadGrant(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !isKbUploadEligible(req.user.email)) {
    res.status(403).json({ error: "Knowledge base uploads are restricted to designated administrators." });
    return;
  }
  const token = req.get(KB_UPLOAD_TOKEN_HEADER)?.trim();
  if (!token) {
    res.status(401).json({ error: "Enter your upload password to continue." });
    return;
  }
  const claimed = await pool.query(
    `UPDATE kb_upload_grants SET used_at = now()
     WHERE token_hash = $1 AND user_id = $2 AND used_at IS NULL AND expires_at > now()
     RETURNING token_hash`,
    [hashToken(token), req.user.id],
  );
  if ((claimed.rowCount ?? 0) === 0) {
    res.status(401).json({ error: "Your upload password session expired. Please enter it again." });
    return;
  }
  next();
}
