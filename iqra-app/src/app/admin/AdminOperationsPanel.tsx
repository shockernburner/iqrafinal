"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { Loader2, RefreshCcw, UploadCloud, Users } from "lucide-react";

type OverviewUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
};

type OverviewData = {
  users: OverviewUser[];
  donation: {
    totalCents: number;
    donationCount: number;
    recent: Array<{ created_at: string; amount_cents: string; customer_email: string | null }>;
  };
  knowledge: {
    totalDocuments: number;
    activeDocuments: number;
  };
  training: {
    totalRows: number;
  };
};

type MaintenanceData = {
  activeJob: {
    id: string;
    action: string;
    status: string;
    startedAt: string;
    logs: string[];
    error: string | null;
  } | null;
  history: Array<{
    id: string;
    action: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    error: string | null;
  }>;
};

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function AdminOperationsPanel() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadOverview() {
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    const payload = await readJson<OverviewData & { error?: string }>(response);
    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load admin overview.");
    }
    setOverview(payload);
  }

  async function loadMaintenance() {
    const response = await fetch("/api/admin/maintenance", { cache: "no-store" });
    const payload = await readJson<MaintenanceData & { error?: string }>(response);
    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load maintenance status.");
    }
    setMaintenance(payload);
  }

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        await Promise.all([loadOverview(), loadMaintenance()]);
      } catch (error) {
        if (!isMounted) return;
        setMessage(error instanceof Error ? error.message : "Could not load admin operations.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!maintenance?.activeJob) return;
    const interval = window.setInterval(() => {
      void loadMaintenance();
      void loadOverview();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [maintenance?.activeJob]);

  async function runMaintenance(action: "refresh-knowledge-index" | "refresh-training-dataset" | "refresh-all") {
    setIsRunningAction(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await readJson<{ error?: string; started?: boolean }>(response);
      if (!response.ok && response.status !== 409) {
        throw new Error(payload.error ?? "Could not start maintenance action.");
      }
      setMessage(response.status === 409 ? "A maintenance job is already running." : "Maintenance job started.");
      await loadMaintenance();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Maintenance action failed.");
    } finally {
      setIsRunningAction(false);
    }
  }

  async function addManualQuestion() {
    if (!manualQuestion.trim() || !manualAnswer.trim()) {
      setMessage("Question and answer are required.");
      return;
    }

    setIsSavingQuestion(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: manualQuestion, answer: manualAnswer }),
      });
      const payload = await readJson<{ error?: string; added?: number }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not add training question.");
      }
      setManualQuestion("");
      setManualAnswer("");
      setMessage(`Added ${payload.added ?? 0} training question.`);
      await loadOverview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add training question.");
    } finally {
      setIsSavingQuestion(false);
    }
  }

  async function uploadTrainingFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);
    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/admin/training", {
        method: "POST",
        body: form,
      });
      const payload = await readJson<{ error?: string; added?: number }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not upload training file.");
      }
      setMessage(`Imported ${payload.added ?? 0} training questions.`);
      await loadOverview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload training file.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="mt-6 space-y-6">
      {message ? <p className="rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#666666] shadow-sm">{message}</p> : null}

      <article className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Maintenance controls</h2>
        <p className="mt-1 text-sm text-[#666666]">Refresh vectors/index and training datasets after uploads.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/60" disabled={isRunningAction} onClick={() => void runMaintenance("refresh-knowledge-index")} type="button">
            {isRunningAction ? <Loader2 className="mr-2 inline animate-spin" size={14} /> : <RefreshCcw className="mr-2 inline" size={14} />}
            Refresh knowledge index
          </button>
          <button className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/60" disabled={isRunningAction} onClick={() => void runMaintenance("refresh-training-dataset")} type="button">
            Refresh training dataset
          </button>
          <button className="rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-sm font-semibold text-[#7A6218] hover:bg-[#D4AF37]/18" disabled={isRunningAction} onClick={() => void runMaintenance("refresh-all")} type="button">
            Refresh all + retrain pipeline
          </button>
        </div>

        {maintenance?.activeJob ? (
          <div className="mt-4 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3">
            <p className="text-sm font-semibold">Running: {maintenance.activeJob.action}</p>
            <p className="mt-1 text-xs text-[#777777]">Started {new Date(maintenance.activeJob.startedAt).toLocaleString()}</p>
            <pre className="mt-3 max-h-52 overflow-auto rounded-md bg-white p-3 text-xs text-[#444444]">
              {(maintenance.activeJob.logs ?? []).slice(-25).join("\n") || "Waiting for logs..."}
            </pre>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#666666]">No maintenance job is running.</p>
        )}
      </article>

      <article className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Training questions and materials</h2>
        <p className="mt-1 text-sm text-[#666666]">Add one question manually or upload a .json/.xlsx file with more rows.</p>

        <div className="mt-4 grid gap-3">
          <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 text-sm" onChange={(event) => setManualQuestion(event.target.value)} placeholder="Training question" value={manualQuestion} />
          <textarea className="min-h-28 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 py-2 text-sm" onChange={(event) => setManualAnswer(event.target.value)} placeholder="Expected answer / response style" value={manualAnswer} />
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/60" disabled={isSavingQuestion} onClick={() => void addManualQuestion()} type="button">
              {isSavingQuestion ? <Loader2 className="mr-2 inline animate-spin" size={14} /> : null}
              Add question
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#E5E5E5] px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/60">
              <UploadCloud size={14} /> Upload .json/.xlsx
              <input accept=".json,.xlsx,.xls" className="sr-only" onChange={uploadTrainingFile} type="file" />
            </label>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#666666]">
          Current training rows: <span className="font-semibold text-[#444444]">{overview?.training.totalRows ?? (isLoading ? "..." : 0)}</span>
        </p>
      </article>

      <article className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Users and donations</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3">
            <p className="text-xs uppercase text-[#777777]">Users</p>
            <p className="mt-1 text-lg font-semibold">{overview?.users.length ?? (isLoading ? "..." : 0)}</p>
          </div>
          <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3">
            <p className="text-xs uppercase text-[#777777]">Donation count</p>
            <p className="mt-1 text-lg font-semibold">{overview?.donation.donationCount ?? (isLoading ? "..." : 0)}</p>
          </div>
          <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3">
            <p className="text-xs uppercase text-[#777777]">Donation total</p>
            <p className="mt-1 text-lg font-semibold">{formatUsd(overview?.donation.totalCents ?? 0)}</p>
          </div>
          <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3">
            <p className="text-xs uppercase text-[#777777]">Active knowledge docs</p>
            <p className="mt-1 text-lg font-semibold">{overview?.knowledge.activeDocuments ?? (isLoading ? "..." : 0)}</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E5E5E5] text-xs uppercase text-[#777777]">
              <tr>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {overview?.users.length ? (
                overview.users.map((user) => (
                  <tr className="border-b border-[#E5E5E5]" key={user.id}>
                    <td className="py-3 pr-4 align-top">
                      <p className="font-semibold">{user.name ?? user.email ?? "Unknown"}</p>
                      <p className="text-xs text-[#777777]">{user.email ?? "No email"}</p>
                    </td>
                    <td className="py-3 pr-4 align-top">{user.role}</td>
                    <td className="py-3 pr-4 align-top">{user.is_active ? "active" : "disabled"}</td>
                    <td className="py-3 pr-4 align-top">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-[#666666]" colSpan={4}>
                    <Users className="mr-2 inline" size={14} /> No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}