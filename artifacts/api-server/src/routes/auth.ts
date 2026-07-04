import crypto from "node:crypto";
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  AcceptLegalResponse,
  ForgotPasswordBody,
  ForgotPasswordResponse,
  GetSessionResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  RegisterBody,
  RegisterResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
} from "@workspace/api-zod";
import {
  attachUser,
  clearSessionCookie,
  findUserByEmail,
  hashPassword,
  requireUser,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
} from "../lib/auth";
import { CURRENT_LEGAL_VERSION } from "../lib/legal";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

router.get("/auth/session", attachUser, async (req, res) => {
  if (!req.user) {
    res.json(GetSessionResponse.parse({ user: null }));
    return;
  }

  // The legal-acceptance status lives in the DB (not the JWT), so it stays fresh
  // even for users whose session cookie predates their acceptance. This also lets
  // us log out any account that has since been deactivated.
  const result = await pool.query<{ legal_accepted_version: string | null; is_active: boolean }>(
    "SELECT legal_accepted_version, is_active FROM users WHERE id = $1",
    [req.user.id],
  );
  const row = result.rows[0];
  if (!row || !row.is_active) {
    clearSessionCookie(res);
    res.json(GetSessionResponse.parse({ user: null }));
    return;
  }

  const legalAccepted = row.legal_accepted_version === CURRENT_LEGAL_VERSION;
  const data = GetSessionResponse.parse({ user: { ...req.user, legalAccepted } });
  res.json(data);
});

router.post("/auth/accept-legal", attachUser, requireUser, async (req, res) => {
  const user = req.user!;
  await pool.query(
    `UPDATE users SET legal_accepted_version = $1, legal_accepted_at = now(), updated_at = now() WHERE id = $2`,
    [CURRENT_LEGAL_VERSION, user.id],
  );
  await pool.query(
    `INSERT INTO audit_log (action, entity_type, entity_id, metadata)
     VALUES ('legal_accepted', 'user', $1, $2::jsonb)`,
    [user.email, JSON.stringify({ version: CURRENT_LEGAL_VERSION })],
  );

  const data = AcceptLegalResponse.parse({ ...user, legalAccepted: true });
  res.json(data);
});

router.post("/auth/login", async (req, res) => {
  const body = LoginBody.parse(req.body);
  const email = body.email.trim().toLowerCase();

  const user = await findUserByEmail(email);
  if (!user || !user.password_hash || !user.is_active) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = signSessionToken(sessionUser);
  setSessionCookie(res, token);

  const legalAccepted = user.legal_accepted_version === CURRENT_LEGAL_VERSION;
  const data = LoginResponse.parse({ ...sessionUser, legalAccepted });
  res.json(data);
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Always responds ok — we never reveal whether an account exists for the email.
router.post("/auth/forgot-password", async (req, res) => {
  const body = ForgotPasswordBody.parse(req.body);
  const email = body.email.trim().toLowerCase();

  const user = await findUserByEmail(email);
  if (user && user.is_active && user.password_hash) {
    // Invalidate any earlier outstanding tokens so only the newest link works.
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt.toISOString()],
    );

    sendPasswordResetEmail(user.email, user.name ?? user.email, token).catch((error) => {
      req.log?.warn?.({ err: error }, "Failed to send password reset email");
    });
  }

  res.json(ForgotPasswordResponse.parse({ ok: true }));
});

router.post("/auth/reset-password", async (req, res) => {
  const body = ResetPasswordBody.parse(req.body);

  if (body.password.length < 12) {
    res.status(400).json({ error: "Password must be at least 12 characters." });
    return;
  }

  const invalid = () =>
    res.status(400).json({
      error: "This reset link is invalid or has expired. Please request a new one.",
    });

  const tokenHash = hashResetToken(body.token);
  const passwordHash = await hashPassword(body.password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomically claim the token: only one concurrent request can flip used_at
    // from NULL, so a reset link is strictly single-use even under a race.
    const claim = await client.query<{ user_id: string }>(
      `UPDATE password_reset_tokens
       SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`,
      [tokenHash],
    );
    const claimed = claim.rows[0];
    if (!claimed) {
      await client.query("ROLLBACK");
      invalid();
      return;
    }

    const userResult = await client.query<{
      id: string;
      email: string;
      name: string | null;
      role: "user" | "admin";
      is_active: boolean;
      legal_accepted_version: string | null;
    }>(
      `SELECT id, email, name, role, is_active, legal_accepted_version FROM users WHERE id = $1 FOR UPDATE`,
      [claimed.user_id],
    );
    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      await client.query("ROLLBACK");
      invalid();
      return;
    }

    await client.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
      passwordHash,
      user.id,
    ]);
    // Burn any other outstanding tokens for this user so old links stop working too.
    await client.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`,
      [user.id],
    );
    await client.query(
      `INSERT INTO audit_log (action, entity_type, entity_id, metadata)
       VALUES ('password_reset', 'user', $1, $2::jsonb)`,
      [user.email, JSON.stringify({ via: "reset_token" })],
    );

    await client.query("COMMIT");

    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    const sessionToken = signSessionToken(sessionUser);
    setSessionCookie(res, sessionToken);

    const legalAccepted = user.legal_accepted_version === CURRENT_LEGAL_VERSION;
    res.json(ResetPasswordResponse.parse({ ...sessionUser, legalAccepted }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
});

router.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  const data = LogoutResponse.parse({ ok: true });
  res.json(data);
});

router.post("/auth/register", async (req, res) => {
  const body = RegisterBody.parse(req.body);
  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim().slice(0, 120) || email;

  if (!/^\S+@\S+\.\S+$/u.test(email)) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }

  if (body.password.length < 12) {
    res.status(400).json({ error: "Password must be at least 12 characters." });
    return;
  }

  const passwordHash = await hashPassword(body.password);

  try {
    const inserted = await pool.query<{ id: string; email: string; name: string; role: "user" | "admin" }>(
      `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'user')
       RETURNING id, email, name, role`,
      [email, name, passwordHash],
    );
    await pool.query(
      `INSERT INTO audit_log (action, entity_type, entity_id, metadata)
       VALUES ('user_registered', 'user', $1, $2::jsonb)`,
      [email, JSON.stringify({ source: "self_service_registration" })],
    );

    sendWelcomeEmail(email, name).catch((error) => {
      req.log?.warn?.({ err: error }, "Failed to send welcome email");
    });

    const row = inserted.rows[0]!;
    const sessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
    const token = signSessionToken(sessionUser);
    setSessionCookie(res, token);

    // A brand-new account has not yet accepted the legal documents; the consent
    // gate on the client will prompt them immediately after registration.
    const data = RegisterResponse.parse({ ...sessionUser, legalAccepted: false });
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    if (message.includes("duplicate key")) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    res.status(500).json({ error: "Registration failed." });
  }
});

export default router;
