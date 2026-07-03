import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/authz";
import { query } from "@/lib/db";

type DocumentRow = {
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

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const result = await query<DocumentRow>(
    `SELECT
       documents.id,
       documents.title,
       documents.status,
       document_versions.id AS version_id,
       document_versions.original_filename,
       document_versions.mime_type,
       document_versions.file_size_bytes::text,
       document_versions.sha256,
       document_versions.page_count,
       document_versions.language,
       document_versions.status AS version_status,
       count(document_chunks.id)::text AS chunk_count,
       latest_job.status AS job_status,
       latest_job.progress AS job_progress,
       latest_job.error_message AS job_error,
       documents.created_at::text
     FROM documents
     LEFT JOIN document_versions ON document_versions.id = documents.current_version_id
     LEFT JOIN document_chunks ON document_chunks.document_version_id = document_versions.id
     LEFT JOIN LATERAL (
       SELECT status, progress, error_message
       FROM ingestion_jobs
       WHERE ingestion_jobs.document_version_id = document_versions.id
       ORDER BY created_at DESC
       LIMIT 1
     ) latest_job ON true
     WHERE documents.status <> 'deleted'
     GROUP BY documents.id, document_versions.id, latest_job.status, latest_job.progress, latest_job.error_message
     ORDER BY documents.created_at DESC
     LIMIT 100`,
  );

  return NextResponse.json({ documents: result.rows });
}
