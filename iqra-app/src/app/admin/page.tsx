import Link from "next/link";
import { Database, FileUp, ListChecks, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/authz";
import { AdminDocumentManager } from "@/app/admin/AdminDocumentManager";
import { AdminOperationsPanel } from "@/app/admin/AdminOperationsPanel";

const adminCards = [
  {
    title: "Knowledge ingestion",
    description: "Upload, validate, index, retry, deactivate, replace, and audit private knowledge-base documents.",
    icon: FileUp,
    status: "Next implementation slice",
  },
  {
    title: "Evaluation runs",
    description: "Run acceptance, groundedness, prompt-injection, referral, language, and citation checks.",
    icon: ListChecks,
    status: "Planned",
  },
  {
    title: "Model and index versions",
    description: "Track base model, adapter, policy, embedding model, reranker, dataset, and index versions.",
    icon: Database,
    status: "Planned",
  },
];

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-8 text-[#444444] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#D4AF37]/12 text-[#8A6D16]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-[#D4AF37]">Admin</p>
              <h1 className="text-xl font-semibold">IQRA control room</h1>
            </div>
          </div>
          <div className="text-sm text-[#666666]">
            Signed in as <span className="font-semibold text-[#444444]">{session.user.email}</span>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm" key={card.title}>
                <Icon className="text-[#D4AF37]" size={24} />
                <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#666666]">{card.description}</p>
                <p className="mt-4 inline-flex rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-semibold text-[#7A6218]">{card.status}</p>
              </article>
            );
          })}
        </section>

        <AdminDocumentManager />
        <AdminOperationsPanel />

        <Link className="mt-6 inline-flex rounded-md border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-semibold hover:border-[#D4AF37]/60" href="/">
          Back to workspace
        </Link>
      </div>
    </main>
  );
}
