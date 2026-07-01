"use client";

import { FileUp, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";

type AdminDocument = {
  id: string;
  title: string;
  status: string;
  version_id: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: string | null;
  sha256: string | null;
  page_count: number | null;
  language: string | null;
  version_status: string | null;
  chunk_count: string;
  job_status: string | null;
  job_progress: number | null;
  job_error: string | null;
  created_at: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function AdminDocumentManager() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadDocuments() {
    setIsLoading(true);
    const response = await fetch("/api/admin/documents", { cache: "no-store" });
    const payload = await readJson<{ documents?: AdminDocument[]; error?: string }>(response);
    if (!response.ok) setMessage(payload.error ?? "Could not load documents.");
    setDocuments(payload.documents ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/documents/upload", { method: "POST", body: form });
    const payload = await readJson<{ error?: string }>(response);
    setIsUploading(false);
    event.target.value = "";
    if (!response.ok) {
      setMessage(payload.error ?? "Upload failed.");
      return;
    }
    setMessage("Upload queued for private ingestion.");
    await loadDocuments();
  }

  async function runAction(id: string, action: "retry" | "activate" | "deactivate" | "delete") {
    setMessage(null);
    const response = await fetch(`/api/admin/documents/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await readJson<{ error?: string }>(response);
    if (!response.ok) {
      setMessage(payload.error ?? "Document action failed.");
      return;
    }
    await loadDocuments();
  }

  return (
    <section className="mt-6 rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Knowledge documents</h2>
          <p className="mt-1 text-sm text-[#666666]">Admin-only lifecycle controls for private knowledge-base uploads.</p>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 text-sm font-semibold text-[#7A6218] hover:bg-[#D4AF37]/18">
          {isUploading ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
          Upload
          <input accept=".pdf,.docx,.txt,.html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html" className="sr-only" disabled={isUploading} onChange={uploadFile} type="file" />
        </label>
      </div>

      {message ? <p className="mt-4 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 py-2 text-sm text-[#666666]">{message}</p> : null}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E5E5] text-xs uppercase text-[#777777]">
            <tr>
              <th className="py-2 pr-4">Document</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Chunks</th>
              <th className="py-2 pr-4">Language</th>
              <th className="py-2 pr-4">Hash</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="py-4 text-[#666666]" colSpan={6}>Loading documents...</td></tr>
            ) : documents.length ? documents.map((document) => (
              <tr className="border-b border-[#E5E5E5]" key={document.id}>
                <td className="py-3 pr-4 align-top">
                  <p className="font-semibold">{document.original_filename ?? document.title}</p>
                  <p className="mt-1 text-xs text-[#777777]">{document.page_count ? `${document.page_count} pages` : "Page count pending"}</p>
                </td>
                <td className="py-3 pr-4 align-top">
                  <p>{document.status}</p>
                  <p className="mt-1 text-xs text-[#777777]">{document.job_status ?? document.version_status ?? "queued"} {document.job_progress !== null ? `${document.job_progress}%` : ""}</p>
                  {document.job_error ? <p className="mt-1 max-w-xs text-xs text-red-700">{document.job_error}</p> : null}
                </td>
                <td className="py-3 pr-4 align-top">{document.chunk_count}</td>
                <td className="py-3 pr-4 align-top">{document.language ?? "unknown"}</td>
                <td className="py-3 pr-4 align-top"><span className="font-mono text-xs">{document.sha256?.slice(0, 12) ?? "pending"}</span></td>
                <td className="py-3 pr-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-semibold hover:border-[#D4AF37]/60" onClick={() => void runAction(document.id, "retry")} type="button"><RotateCcw size={12} className="inline" /> Retry</button>
                    <button className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-semibold hover:border-[#D4AF37]/60" onClick={() => void runAction(document.id, document.status === "active" ? "deactivate" : "activate")} type="button">{document.status === "active" ? "Deactivate" : "Activate"}</button>
                    <button className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => void runAction(document.id, "delete")} type="button"><Trash2 size={12} className="inline" /> Delete</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td className="py-4 text-[#666666]" colSpan={6}>No knowledge documents uploaded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
