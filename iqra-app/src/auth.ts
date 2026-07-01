import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

type IqraRole = "user" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: IqraRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: IqraRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: IqraRole;
  }
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function authorizeCredentials(credentials?: Partial<Record<"email" | "password", unknown>>) {
  const email = normalizeEmail(credentials?.email);
  const password = normalizePassword(credentials?.password);
  if (!email || !password) return null;

  const result = await query<{
    id: string;
    email: string;
    name: string | null;
    password_hash: string | null;
    role: IqraRole;
  }>(
    `SELECT id, email, name, password_hash, role
     FROM users
     WHERE email = $1 AND is_active = true
     LIMIT 1`,
    [email],
  );

  const user = result.rows[0];
  if (!user?.password_hash) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
  };
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: { id?: string; role?: IqraRole } }) {
      if (user?.id) token.id = user.id;
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role === "admin" ? "admin" : "user";
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
