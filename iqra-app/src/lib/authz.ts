import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/");
  return session;
}

export async function getAdminApiSession() {
  const session = await auth();
  return session?.user?.id && session.user.role === "admin" ? session : null;
}

