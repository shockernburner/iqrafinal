import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";
import { CURRENT_LEGAL_VERSION } from "./legal";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required but was not provided.");
}

export const SESSION_COOKIE_NAME = "iqra_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: SessionUser) {
  return jwt.sign(user, SESSION_SECRET as string, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, SESSION_SECRET as string) as SessionUser;
    req.user = decoded;
  } catch {
    // Invalid/expired token: treat as unauthenticated.
  }

  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

export async function requireLegalAccepted(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const result = await pool.query<{ legal_accepted_version: string | null }>(
    "SELECT legal_accepted_version FROM users WHERE id = $1",
    [req.user.id],
  );
  const row = result.rows[0];
  if (!row || row.legal_accepted_version !== CURRENT_LEGAL_VERSION) {
    res.status(403).json({ error: "You must accept the latest legal documents to continue." });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  next();
}

export async function findUserByEmail(email: string) {
  const result = await pool.query<{
    id: string;
    email: string;
    name: string | null;
    password_hash: string | null;
    role: "user" | "admin";
    is_active: boolean;
    legal_accepted_version: string | null;
  }>(
    "SELECT id, email, name, password_hash, role, is_active, legal_accepted_version FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] ?? null;
}
