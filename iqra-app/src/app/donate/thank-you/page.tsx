import Link from "next/link";
import { Landmark } from "lucide-react";

export default function DonationThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 text-[#444444]">
      <section className="w-full max-w-md rounded-md border border-[#E5E5E5] bg-white p-6 text-center shadow-sm">
        <Landmark className="mx-auto text-[#D4AF37]" size={42} />
        <h1 className="mt-4 text-2xl font-semibold">Donation received</h1>
        <p className="mt-3 text-sm leading-6 text-[#666666]">Thank you for supporting IQRA&apos;s source-grounded Islamic knowledge experience.</p>
        <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#D4AF37] px-4 text-sm font-semibold text-white" href="/">
          Return to IQRA
        </Link>
      </section>
    </main>
  );
}
