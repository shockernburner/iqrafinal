import { Readable } from "node:stream";
import { Router, type IRouter } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { pool } from "@workspace/db";
import {
  AddAdminTrainingBody,
  AddAdminTrainingResponse,
  GetAdminMaintenanceResponse,
  GetAdminOverviewResponse,
  ListAdminDonationsResponse,
  ListAdminDocumentsResponse,
  ListAdminUsersResponse,
  ListAdminTrainingResponse,
  PutSiteContentBody,
  PutSiteContentResponse,
  StartAdminMaintenanceBody,
  StartAdminMaintenanceResponse,
  UpdateAdminDocumentBody,
  UpdateAdminDocumentParams,
  UpdateAdminDocumentResponse,
  UploadAdminDocumentResponse,
  UploadAdminTrainingDatasetResponse,
} from "@workspace/api-zod";
import { attachUser, requireAdmin, requireLegalAccepted } from "../lib/auth";
import { getAdminMaintenanceStatus, startAdminMaintenance } from "../lib/admin-maintenance";
import { storeKnowledgeUpload } from "../lib/knowledge-upload";
import { addTrainingRecord, bulkAddTrainingRecords, loadTrainingRecords } from "../lib/training-data";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function sanitizeSheetName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60);
  return base.length > 0 ? base : "upload";
}

const QUESTION_HEADER = /quest|prompt|^q$|input/i;
const ANSWER_HEADER = /answ|response|expected|output|^a$/i;

function pickColumns(header: string[]): { q: number; a: number } {
  let q = header.findIndex((h) => QUESTION_HEADER.test(h));
  let a = header.findIndex((h) => ANSWER_HEADER.test(h));
  // Fall back to positional (first two columns) when headers aren't recognizable.
  if (q === -1 && a === -1) return { q: 0, a: 1 };
  if (q === -1) q = a === 0 ? 1 : 0;
  if (a === -1) a = q === 0 ? 1 : 0;
  return { q, a };
}

async function parseTrainingDataset(
  file: Express.Multer.File,
): Promise<Array<{ question: string; answer: string }>> {
  const workbook = new ExcelJS.Workbook();
  const isCsv = /\.csv$/i.test(file.originalname) || file.mimetype === "text/csv";
  // Use exceljs's stream API for both formats: its buffer-based `load()` typing
  // predates @types/node's generic Buffer and is nominally incompatible.
  if (isCsv) {
    await workbook.csv.read(Readable.from(file.buffer.toString("utf8")));
  } else {
    await workbook.xlsx.read(Readable.from(file.buffer));
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const matrix: string[][] = [];
  sheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cell.text?.toString().trim() ?? "");
    });
    matrix.push(cells);
  });
  if (matrix.length === 0) return [];

  // Detect whether the first row is a header (contains recognizable column names).
  const first = matrix[0];
  const hasHeader = first.some((h) => QUESTION_HEADER.test(h) || ANSWER_HEADER.test(h));
  const { q, a } = pickColumns(hasHeader ? first : []);
  const dataRows = hasHeader ? matrix.slice(1) : matrix;

  return dataRows.map((cells) => ({
    question: cells[q] ?? "",
    answer: cells[a] ?? "",
  }));
}

router.use(attachUser, requireAdmin, requireLegalAccepted);

router.get("/overview", async (_req, res) => {
  const [documentsTotal, activeDocuments, usersTotal, adminsTotal, donations, trainingRecords, recentUsers] =
    await Promise.all([
      pool.query<{ count: string }>("SELECT count(*) FROM documents"),
      pool.query<{ count: string }>("SELECT count(*) FROM documents WHERE status = 'active'"),
      pool.query<{ count: string }>("SELECT count(*) FROM users"),
      pool.query<{ count: string }>("SELECT count(*) FROM users WHERE role = 'admin'"),
      pool.query<{ event_id: string; amount_cents: number | null; created_at: Date }>(
        `SELECT event_id, (payload->>'amountCents')::int AS amount_cents, created_at
         FROM stripe_events ORDER BY created_at DESC LIMIT 5`,
      ),
      loadTrainingRecords(),
      pool.query<{ id: string; email: string | null; name: string | null; role: string; created_at: Date }>(
        "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5",
      ),
    ]);

  // Totals come from the donations table (same source as the /admin/donations
  // detail tab) so the overview card and the detail list can never diverge.
  const donationsCountResult = await pool.query<{ count: string }>(
    "SELECT count(*) FROM donations",
  );
  const donationsTotalResult = await pool.query<{ total: string | null }>(
    "SELECT sum(amount_cents) AS total FROM donations",
  );

  const data = GetAdminOverviewResponse.parse({
    documentsTotal: Number(documentsTotal.rows[0]?.count ?? 0),
    activeDocuments: Number(activeDocuments.rows[0]?.count ?? 0),
    usersTotal: Number(usersTotal.rows[0]?.count ?? 0),
    adminsTotal: Number(adminsTotal.rows[0]?.count ?? 0),
    donationsTotal: Number(donationsTotalResult.rows[0]?.total ?? 0),
    donationsCount: Number(donationsCountResult.rows[0]?.count ?? 0),
    trainingRowsTotal: trainingRecords.length,
    recentUsers: recentUsers.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at.toISOString(),
    })),
    recentDonations: donations.rows.map((row) => ({
      eventId: row.event_id,
      amountCents: row.amount_cents,
      createdAt: row.created_at.toISOString(),
    })),
  });
  res.json(data);
});

router.get("/donations", async (_req, res) => {
  const donations = await pool.query<{
    id: string;
    name: string | null;
    email: string | null;
    amount_cents: number;
    currency: string;
    country: string | null;
    anonymous: boolean;
    created_at: Date;
  }>(
    `SELECT d.id, u.name AS name, d.email, d.amount_cents, d.currency, d.country, d.anonymous, d.created_at
     FROM donations d
     LEFT JOIN users u ON u.id = d.user_id
     ORDER BY d.created_at DESC`,
  );

  const data = ListAdminDonationsResponse.parse({
    donations: donations.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      amountCents: row.amount_cents,
      currency: row.currency,
      country: row.country,
      anonymous: row.anonymous,
      createdAt: row.created_at.toISOString(),
    })),
    total: donations.rows.length,
  });
  res.json(data);
});

router.get("/users", async (_req, res) => {
  const users = await pool.query<{
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    is_active: boolean;
    created_at: Date;
    chat_count: string;
    last_active_at: Date | null;
  }>(
    `SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at,
       count(t.id) AS chat_count,
       max(t.last_message_at) AS last_active_at
     FROM users u
     LEFT JOIN chat_threads t ON t.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  );

  const data = ListAdminUsersResponse.parse({
    users: users.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      chatCount: Number(row.chat_count),
      lastActiveAt: row.last_active_at ? row.last_active_at.toISOString() : null,
    })),
  });
  res.json(data);
});

router.get("/documents", async (_req, res) => {
  const documents = await pool.query<{
    id: string;
    title: string;
    status: string;
    created_at: Date;
    version_id: string | null;
    original_filename: string | null;
    version_status: string | null;
    file_size_bytes: string | null;
    version_created_at: Date | null;
    job_id: string | null;
    job_status: string | null;
    job_progress: number | null;
    job_error: string | null;
  }>(
    `SELECT d.id, d.title, d.status, d.created_at,
       v.id AS version_id, v.original_filename, v.status AS version_status, v.file_size_bytes, v.created_at AS version_created_at,
       j.id AS job_id, j.status AS job_status, j.progress AS job_progress, j.error_message AS job_error
     FROM documents d
     LEFT JOIN document_versions v ON v.id = d.current_version_id
     LEFT JOIN LATERAL (
       SELECT * FROM ingestion_jobs ij WHERE ij.document_version_id = v.id ORDER BY ij.created_at DESC LIMIT 1
     ) j ON true
     ORDER BY d.created_at DESC`,
  );

  const data = ListAdminDocumentsResponse.parse({
    documents: documents.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      currentVersion: row.version_id
        ? {
            id: row.version_id,
            originalFilename: row.original_filename!,
            status: row.version_status!,
            fileSizeBytes: Number(row.file_size_bytes),
            uploadedAt: row.version_created_at!.toISOString(),
          }
        : null,
      latestJob: row.job_id
        ? {
            id: row.job_id,
            status: row.job_status!,
            progress: row.job_progress!,
            errorMessage: row.job_error,
          }
        : null,
    })),
  });
  res.json(data);
});

router.post("/documents/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "A file is required." });
    return;
  }

  const result = await storeKnowledgeUpload(req.file, req.user!.id);
  if ("error" in result) {
    res.status(result.status ?? 500).json({ error: result.error });
    return;
  }

  const data = UploadAdminDocumentResponse.parse({
    documentId: result.documentId,
    versionId: result.versionId,
    jobId: result.jobId,
    ingestionStatus: result.ingestionStatus,
  });
  res.status(201).json(data);
});

router.patch("/documents/:id", async (req, res) => {
  const params = UpdateAdminDocumentParams.parse(req.params);
  const body = UpdateAdminDocumentBody.parse(req.body);

  if (body.action === "delete") {
    await pool.query("UPDATE documents SET status = 'deleted', updated_at = now() WHERE id = $1", [params.id]);
  } else if (body.action === "activate") {
    await pool.query("UPDATE documents SET status = 'active', updated_at = now() WHERE id = $1", [params.id]);
  } else if (body.action === "deactivate") {
    await pool.query("UPDATE documents SET status = 'inactive', updated_at = now() WHERE id = $1", [params.id]);
  } else if (body.action === "retry") {
    await pool.query(
      `UPDATE ingestion_jobs SET status = 'queued', retry_count = retry_count + 1, error_message = NULL, updated_at = now()
       WHERE document_version_id = (SELECT current_version_id FROM documents WHERE id = $1)`,
      [params.id],
    );
  }

  const data = UpdateAdminDocumentResponse.parse({ ok: true });
  res.json(data);
});

router.get("/maintenance", (_req, res) => {
  const data = GetAdminMaintenanceResponse.parse(getAdminMaintenanceStatus());
  res.json(data);
});

router.post("/maintenance", (req, res) => {
  const body = StartAdminMaintenanceBody.parse(req.body);
  const result = startAdminMaintenance(body.action, req.user!.email);
  const data = StartAdminMaintenanceResponse.parse(result);
  res.json(data);
});

router.put("/content", async (req, res) => {
  const body = PutSiteContentBody.parse(req.body);
  const entries = Object.entries(body).filter(([, value]) => value !== undefined);

  for (const [key, value] of entries) {
    await pool.query(
      `INSERT INTO site_content (key, value, updated_by, updated_at)
       VALUES ($1, $2::jsonb, $3, now())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [key, JSON.stringify(value), req.user!.id],
    );
  }

  const result = await pool.query<{ key: string; value: unknown }>(
    "SELECT key, value FROM site_content",
  );
  const content: Record<string, unknown> = {};
  for (const row of result.rows) content[row.key] = row.value;

  const data = PutSiteContentResponse.parse(content);
  res.json(data);
});

router.get("/training", async (req, res) => {
  const records = await loadTrainingRecords();
  const limit = 50;
  const data = ListAdminTrainingResponse.parse({
    records: records.slice(0, limit),
    total: records.length,
  });
  res.json(data);
});

router.post("/training", async (req, res) => {
  const body = AddAdminTrainingBody.parse(req.body);
  await addTrainingRecord(body.question, body.answer);
  const data = AddAdminTrainingResponse.parse({ ok: true });
  res.status(201).json(data);
});

router.post("/training/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "A file is required." });
    return;
  }

  let rows: Array<{ question: string; answer: string }>;
  try {
    rows = await parseTrainingDataset(req.file);
  } catch {
    res.status(400).json({ error: "Could not read the file. Upload a valid .xlsx or .csv." });
    return;
  }

  if (rows.length === 0) {
    res.status(400).json({
      error: "No rows found. The file needs a 'question' column and an 'answer' column.",
    });
    return;
  }

  const sheet = sanitizeSheetName(req.file.originalname);
  const added = await bulkAddTrainingRecords(rows, sheet);
  const data = UploadAdminTrainingDatasetResponse.parse({
    added,
    skipped: rows.length - added,
    total: rows.length,
  });
  res.json(data);
});

export default router;
