"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setIsSubmitting(false);
    if (!response.ok) {
      setError(payload.error ?? "Registration failed.");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-10 text-[#444444]">
      <section className="w-full max-w-md rounded-md border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#D4AF37]/12 text-[#8A6D16]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-[#D4AF37]">IQRA</p>
            <h1 className="text-xl font-semibold">Create account</h1>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            Name
            <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" name="name" type="text" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" name="email" required type="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" minLength={12} name="password" required type="password" />
          </label>
          {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#444444] px-4 text-sm font-semibold text-white hover:bg-[#2F2F2F]" disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} Register
          </button>
        </form>

        <p className="mt-4 text-sm text-[#666666]">
          Already have an account? <Link className="font-semibold text-[#8A6D16]" href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
