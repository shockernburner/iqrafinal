import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { scope: "register", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const body = (await request.json()) as { email?: unknown; password?: unknown; name?: unknown };
  const email = normalizeEmail(body.email);
  const name = normalizeName(body.name);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^\S+@\S+\.\S+$/u.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (password.length < 12) {
    return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, 'user')`,
      [email, name || email, passwordHash],
    );
    await query(
      `INSERT INTO audit_log (action, entity_type, entity_id, metadata)
       VALUES ('user_registered', 'user', $1, $2::jsonb)`,
      [email, JSON.stringify({ source: "self_service_registration" })],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    if (message.includes("duplicate key")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration is not available until the database is configured." }, { status: 503 });
  }
}
