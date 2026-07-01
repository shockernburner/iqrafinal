import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 text-[#444444]">
      <section className="w-full max-w-md rounded-md border border-[#E5E5E5] bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Checkout cancelled</h1>
        <p className="mt-3 text-sm leading-6 text-[#666666]">No payment was taken. You can restart the Pro trial whenever you are ready.</p>
        <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#444444] px-4 text-sm font-semibold text-white" href="/">
          Back to workspace
        </Link>
      </section>
    </main>
  );
}
