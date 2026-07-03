import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  GetSessionResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  RegisterBody,
  RegisterResponse,
} from "@workspace/api-zod";
import {
  attachUser,
  clearSessionCookie,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
} from "../lib/auth";
import { sendWelcomeEmail } from "../lib/email";

const router: IRouter = Router();

router.get("/auth/session", attachUser, (req, res) => {
  const data = GetSessionResponse.parse({ user: req.user ?? null });
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

  const data = LoginResponse.parse(sessionUser);
  res.json(data);
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

    const data = RegisterResponse.parse(sessionUser);
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
