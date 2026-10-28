import { Readable } from "node:stream";
import {
  Router,
  type IRouter,
  type Request,
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import { pool } from "@workspace/db";
import {
  AddAdminCorporateSponsorResponse,
  AddAdminDonorBody,
  AddAdminDonorResponse,
  AddAdminTrainingBody,
  AddAdminTrainingResponse,
  DeleteAdminCorporateSponsorParams,
  DeleteAdminCorporateSponsorResponse,
  DeleteAdminDonorParams,
  DeleteAdminDonorResponse,
  GetKbUploadStatusResponse,
  ListAdminCorporateSponsorsResponse,
  ListAdminDonorsResponse,
  SetupKbUploadPasswordBody,
  SetupKbUploadPasswordResponse,
  VerifyKbUploadPasswordBody,
  VerifyKbUploadPasswordResponse,
  GetAdminGrowthResponse,
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
  UploadAdminDocumentsBatchResponse,
  GetAdminDriveImportResponse,
  UploadAdminTrainingDatasetResponse,
} from "@workspace/api-zod";
import { attachUser, requireAdmin, requireLegalAccepted } from "../lib/auth";
import { getAdminMaintenanceStatus, startAdminMaintenance } from "../lib/admin-maintenance";
import { storeKnowledgeUpload } from "../lib/knowledge-upload";
import { startDriveImport, getDriveImportStatus, cancelDriveImport } from "../lib/drive-import";
import { addTrainingRecord, bulkAddTrainingRecords, loadTrainingRecords } from "../lib/training-data";
import {
  hasKbUploadPassword,
  isKbUploadEligible,
  requireKbUploadGrant,
  setupKbUploadPassword,
  verifyKbUploadPassword,
} from "../lib/kb-upload-auth";
import { normalizeCountry } from "../lib/pricing";
import { corporateSponsorLogoUrl, detectLogoMime, MAX_LOGO_BYTES } from "../lib/corporate-sponsors";

const router: IRouter = Router();

// One authoritative upload budget: applies per file, per batch total, and as the
// request-level guard. Keep in sync with the frontend's advertised 50 MB limit.
const MAX_UPLOAD_BYTES = Number(process.env.MAX_KNOWLEDGE_UPLOAD_BYTES ?? 50 * 1024 * 1024);
const MAX_BATCH_FILES = 50;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } });
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_LOGO_BYTES, files: 1 } });

/** Reject requests whose declared body size exceeds the budget BEFORE multer buffers anything. */
function uploadBudgetGuard(req: Request, res: Response, next: NextFunction) {
  const contentLength = Number(req.headers["content-length"] ?? 0);
  // Small allowance for multipart boundaries/headers on top of the file budget.
  if (contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
    res.status(400).json({
      error: `Total upload size exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit.`,
    });
    return;
  }
  next();
}

/** Wrap a multer middleware so its errors surface as documented JSON 400s, not HTML 500s. */
function withMulterErrors(middleware: RequestHandler): RequestHandler {
  return (req, res, next) => {
    middleware(req, res, (err?: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? `A file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB per-file limit.`
            : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
              ? `Too many files in one batch (max ${MAX_BATCH_FILES}).`
              : "Invalid upload request.";
        res.status(400).json({ error: message });
        return;
      }
      next(err);
    });
  };
}

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
  const [documentsTotal, activeDocuments, usersTotal, adminsTotal, donations, trainingRecords, recentUsers, questionsReplied] =
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
      pool.query<{ count: string }>("SELECT count FROM site_stats WHERE key = 'questions_replied'"),
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
    questionsRepliedTotal: Number(questionsReplied.rows[0]?.count ?? 0),
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

router.get("/growth", async (_req, res) => {
  // 90-day daily time-series with gap-filled dates (generate_series) so charts
  // render a continuous line even on days with zero activity.
  const [signups, donations, visits, totals] = await Promise.all([
    pool.query<{ date: string; count: number }>(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS date, COALESCE(c.count, 0)::int AS count
       FROM generate_series(current_date - interval '89 days', current_date, interval '1 day') d
       LEFT JOIN (
         SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
         FROM users GROUP BY 1
       ) c ON c.day = d::date
       ORDER BY d`,
    ),
    pool.query<{ date: string; count: number; amount_cents: number }>(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS date, COALESCE(c.count, 0)::int AS count,
              COALESCE(c.amount, 0)::int AS amount_cents
       FROM generate_series(current_date - interval '89 days', current_date, interval '1 day') d
       LEFT JOIN (
         SELECT date_trunc('day', created_at)::date AS day, count(*) AS count, sum(amount_cents) AS amount
         FROM donations GROUP BY 1
       ) c ON c.day = d::date
       ORDER BY d`,
    ),
    pool.query<{ date: string; count: number }>(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS date, COALESCE(c.count, 0)::int AS count
       FROM generate_series(current_date - interval '89 days', current_date, interval '1 day') d
       LEFT JOIN (
         SELECT date_trunc('day', created_at)::date AS day, count(*) AS count
         FROM page_visit_events GROUP BY 1
       ) c ON c.day = d::date
       ORDER BY d`,
    ),
    pool.query<{
      users: string;
      page_visits: string | null;
      donations_count: string;
      donations_amount_cents: string;
    }>(
      `SELECT
         (SELECT count(*) FROM users) AS users,
         (SELECT count FROM site_stats WHERE key = 'page_visits') AS page_visits,
         (SELECT count(*) FROM donations) AS donations_count,
         (SELECT COALESCE(sum(amount_cents), 0) FROM donations) AS donations_amount_cents`,
    ),
  ]);

  const t = totals.rows[0];
  const data = GetAdminGrowthResponse.parse({
    signups: signups.rows.map((r) => ({ date: r.date, count: r.count })),
    donations: donations.rows.map((r) => ({
      date: r.date,
      count: r.count,
      amountCents: r.amount_cents,
    })),
    visits: visits.rows.map((r) => ({ date: r.date, count: r.count })),
    totals: {
      users: Number(t?.users ?? 0),
      pageVisits: Number(t?.page_visits ?? 0),
      donationsCount: Number(t?.donations_count ?? 0),
      donationsAmountCents: Number(t?.donations_amount_cents ?? 0),
    },
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

router.post("/documents/upload-batch", requireKbUploadGrant, uploadBudgetGuard, withMulterErrors(upload.array("files", MAX_BATCH_FILES)), async (req, res) => {
  const files = (req.files ?? []) as Express.Multer.File[];
  if (!files.length) {
    res.status(400).json({ error: "At least one file is required." });
    return;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_UPLOAD_BYTES) {
    res.status(400).json({
      error: `Total upload size (${(totalBytes / 1024 / 1024).toFixed(1)} MB) exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB batch limit.`,
    });
    return;
  }

  const results = [] as Array<{
    fileName: string;
    ok: boolean;
    error: string | null;
    documentId: string | null;
    versionId: string | null;
    jobId: string | null;
    ingestionStatus: string | null;
  }>;
  for (const file of files) {
    try {
      const result = await storeKnowledgeUpload(file, req.user!.id);
      if ("error" in result) {
        results.push({
          fileName: file.originalname,
          ok: false,
          error: result.error ?? "Upload failed.",
          documentId: null,
          versionId: null,
          jobId: null,
          ingestionStatus: null,
        });
      } else {
        results.push({
          fileName: file.originalname,
          ok: true,
          error: null,
          documentId: result.documentId,
          versionId: result.versionId,
          jobId: result.jobId,
          ingestionStatus: result.ingestionStatus,
        });
      }
    } catch (error) {
      req.log.error({ err: error, fileName: file.originalname }, "Batch upload file failed");
      results.push({
        fileName: file.originalname,
        ok: false,
        error: "Unexpected error while storing this file.",
        documentId: null,
        versionId: null,
        jobId: null,
        ingestionStatus: null,
      });
    }
  }

  const data = UploadAdminDocumentsBatchResponse.parse({
    results,
    uploadedCount: results.filter((r) => r.ok).length,
    failedCount: results.filter((r) => !r.ok).length,
  });
  res.json(data);
});

router.post("/documents/import-drive", requireKbUploadGrant, async (req, res) => {
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!url) {
    res.status(400).json({ error: "A Google Drive folder link is required." });
    return;
  }
  const result = startDriveImport(url, req.user!.id);
  if (!result.started) {
    if ("invalidUrl" in result && result.invalidUrl) {
      res.status(400).json({ error: "That doesn't look like a Google Drive folder link." });
      return;
    }
    res.status(409).json({ error: "A Drive import is already running. Wait for it to finish or cancel it." });
    return;
  }
  res.json(GetAdminDriveImportResponse.parse({ job: result.job }));
});

router.get("/documents/import-drive", async (_req, res) => {
  res.json(GetAdminDriveImportResponse.parse({ job: getDriveImportStatus() }));
});

router.post("/documents/import-drive/cancel", async (_req, res) => {
  if (!cancelDriveImport()) {
    res.status(409).json({ error: "No Drive import is currently running." });
    return;
  }
  res.json(GetAdminDriveImportResponse.parse({ job: getDriveImportStatus() }));
});

router.post("/documents/upload", requireKbUploadGrant, uploadBudgetGuard, withMulterErrors(upload.single("file")), async (req, res) => {
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
    // Only failed jobs on failed versions are retryable. Succeeded versions have
    // had their original file purged from storage (storage-saving policy), so
    // re-queuing them would fail and clobber a healthy indexed document. The
    // status predicates also prevent double-queuing a job that is already
    // queued or processing.
    const retried = await pool.query(
      `UPDATE ingestion_jobs SET status = 'queued', retry_count = retry_count + 1, error_message = NULL, updated_at = now()
       WHERE document_version_id = (SELECT current_version_id FROM documents WHERE id = $1)
         AND status = 'failed'
         AND document_version_id IN (SELECT id FROM document_versions WHERE status = 'failed')`,
      [params.id],
    );
    if (retried.rowCount === 0) {
      res.status(409).json({
        error:
          "Only failed documents can be retried. Indexed documents no longer keep their original file — re-upload to re-index.",
      });
      return;
    }
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

router.get("/kb-upload/status", async (req, res) => {
  const eligible = isKbUploadEligible(req.user!.email);
  const configured = eligible ? await hasKbUploadPassword(req.user!.id) : false;
  res.json(GetKbUploadStatusResponse.parse({ eligible, configured }));
});

router.post("/kb-upload/setup", async (req, res) => {
  if (!isKbUploadEligible(req.user!.email)) {
    res.status(403).json({ error: "Knowledge base uploads are restricted to designated administrators." });
    return;
  }
  const body = SetupKbUploadPasswordBody.parse(req.body);
  const result = await setupKbUploadPassword(req.user!.id, body.password);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(SetupKbUploadPasswordResponse.parse({ token: result.token, expiresAt: result.expiresAt }));
});

router.post("/kb-upload/verify", async (req, res) => {
  if (!isKbUploadEligible(req.user!.email)) {
    res.status(403).json({ error: "Knowledge base uploads are restricted to designated administrators." });
    return;
  }
  const body = VerifyKbUploadPasswordBody.parse(req.body);
  const result = await verifyKbUploadPassword(req.user!.id, body.password);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(VerifyKbUploadPasswordResponse.parse({ token: result.token, expiresAt: result.expiresAt }));
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts YYYY-MM-DD (not in the future); empty means "today". Returns undefined when invalid. */
function parseOptionalDate(input: unknown): string | null | undefined {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input !== "string" || !ISO_DATE.test(input)) return undefined;
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) return undefined;
  // One day of slack so admins ahead of UTC can pick their local "today".
  if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) return undefined;
  return input;
}

type ManualDonorRow = {
  id: string;
  name: string;
  country: string | null;
  anonymous: boolean;
  donated_on: string;
  created_at: Date;
};

function serializeDonor(row: ManualDonorRow) {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    anonymous: row.anonymous,
    donatedAt: row.donated_on,
    createdAt: row.created_at.toISOString(),
  };
}

const DONOR_COLUMNS = "id, name, country, anonymous, donated_on::text AS donated_on, created_at";

router.get("/donors", async (_req, res) => {
  const result = await pool.query<ManualDonorRow>(
    `SELECT ${DONOR_COLUMNS} FROM manual_donors ORDER BY donated_on, created_at`,
  );
  res.json(ListAdminDonorsResponse.parse({ donors: result.rows.map(serializeDonor) }));
});

router.post("/donors", async (req, res) => {
  const body = AddAdminDonorBody.parse(req.body);
  const name = body.name.trim().slice(0, 120);
  if (!name) {
    res.status(400).json({ error: "Donor name is required." });
    return;
  }
  const donatedOn = parseOptionalDate(body.donatedAt);
  if (donatedOn === undefined) {
    res.status(400).json({ error: "Donation date must be a valid date (YYYY-MM-DD), not in the future." });
    return;
  }
  const result = await pool.query<ManualDonorRow>(
    `INSERT INTO manual_donors (name, country, anonymous, donated_on, created_by)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5)
     RETURNING ${DONOR_COLUMNS}`,
    [name, normalizeCountry(body.country), body.anonymous ?? false, donatedOn, req.user!.id],
  );
  const row = result.rows[0]!;
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'manual_donor_added', 'manual_donor', $2, $3::jsonb)`,
    [req.user!.id, row.id, JSON.stringify({ name })],
  );
  res.json(AddAdminDonorResponse.parse(serializeDonor(row)));
});

router.delete("/donors/:id", async (req, res) => {
  const params = DeleteAdminDonorParams.parse(req.params);
  const deleted = await pool.query<{ name: string }>(
    "DELETE FROM manual_donors WHERE id::text = $1 RETURNING name",
    [params.id],
  );
  if (!deleted.rows[0]) {
    res.status(404).json({ error: "Donor not found." });
    return;
  }
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'manual_donor_removed', 'manual_donor', $2, $3::jsonb)`,
    [req.user!.id, params.id, JSON.stringify({ name: deleted.rows[0].name })],
  );
  res.json(DeleteAdminDonorResponse.parse({ ok: true }));
});

type CorporateSponsorRow = {
  id: string;
  name: string;
  website_url: string | null;
  sponsored_since: string;
  created_at: Date;
};

const SPONSOR_COLUMNS = "id, name, website_url, sponsored_since::text AS sponsored_since, created_at";

function serializeCorporateSponsor(row: CorporateSponsorRow) {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    logoUrl: corporateSponsorLogoUrl(row.id),
    sponsoredSince: row.sponsored_since,
    createdAt: row.created_at.toISOString(),
  };
}

/** Optional website: blank → null; bare domains get https://; anything else invalid → undefined. */
function normalizeWebsiteUrl(input: unknown): string | null | undefined {
  if (typeof input !== "string" || !input.trim()) return null;
  const raw = input.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (!url.hostname.includes(".")) return undefined;
    return url.toString().slice(0, 500);
  } catch {
    return undefined;
  }
}

router.get("/corporate-sponsors", async (_req, res) => {
  const result = await pool.query<CorporateSponsorRow>(
    `SELECT ${SPONSOR_COLUMNS} FROM corporate_sponsors ORDER BY sponsored_since, created_at`,
  );
  res.json(ListAdminCorporateSponsorsResponse.parse({ sponsors: result.rows.map(serializeCorporateSponsor) }));
});

const logoUploadWithErrors: RequestHandler = (req, res, next) => {
  logoUpload.single("logo")(req, res, (err?: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        error:
          err.code === "LIMIT_FILE_SIZE"
            ? `The logo must be ${Math.round(MAX_LOGO_BYTES / 1024 / 1024)} MB or smaller.`
            : "Invalid upload request.",
      });
      return;
    }
    next(err);
  });
};

router.post("/corporate-sponsors", logoUploadWithErrors, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
  if (!name) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "A company logo is required." });
    return;
  }
  const mime = detectLogoMime(req.file.buffer);
  if (!mime) {
    res.status(400).json({ error: "The logo must be a PNG, JPEG, or WebP image." });
    return;
  }
  const websiteUrl = normalizeWebsiteUrl(req.body?.websiteUrl);
  if (websiteUrl === undefined) {
    res.status(400).json({ error: "Website must be a valid http(s) address." });
    return;
  }
  const sponsoredSince = parseOptionalDate(req.body?.sponsoredSince);
  if (sponsoredSince === undefined) {
    res.status(400).json({ error: "Sponsorship date must be a valid date (YYYY-MM-DD), not in the future." });
    return;
  }

  const result = await pool.query<CorporateSponsorRow>(
    `INSERT INTO corporate_sponsors (name, website_url, logo, logo_mime, sponsored_since, created_by)
     VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
     RETURNING ${SPONSOR_COLUMNS}`,
    [name, websiteUrl, req.file.buffer, mime, sponsoredSince, req.user!.id],
  );
  const row = result.rows[0]!;
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'corporate_sponsor_added', 'corporate_sponsor', $2, $3::jsonb)`,
    [req.user!.id, row.id, JSON.stringify({ name })],
  );
  res.json(AddAdminCorporateSponsorResponse.parse(serializeCorporateSponsor(row)));
});

router.delete("/corporate-sponsors/:id", async (req, res) => {
  const params = DeleteAdminCorporateSponsorParams.parse(req.params);
  const deleted = await pool.query<{ name: string }>(
    "DELETE FROM corporate_sponsors WHERE id::text = $1 RETURNING name",
    [params.id],
  );
  if (!deleted.rows[0]) {
    res.status(404).json({ error: "Sponsor not found." });
    return;
  }
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'corporate_sponsor_removed', 'corporate_sponsor', $2, $3::jsonb)`,
    [req.user!.id, params.id, JSON.stringify({ name: deleted.rows[0].name })],
  );
  res.json(DeleteAdminCorporateSponsorResponse.parse({ ok: true }));
});

export default router;
