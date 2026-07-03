import { Router, type IRouter } from "express";
import multer from "multer";
import { pool } from "@workspace/db";
import {
  AddAdminTrainingBody,
  AddAdminTrainingResponse,
  GetAdminMaintenanceResponse,
  GetAdminOverviewResponse,
  ListAdminDocumentsResponse,
  ListAdminTrainingResponse,
  StartAdminMaintenanceBody,
  StartAdminMaintenanceResponse,
  UpdateAdminDocumentBody,
  UpdateAdminDocumentParams,
  UpdateAdminDocumentResponse,
  UploadAdminDocumentResponse,
} from "@workspace/api-zod";
import { attachUser, requireAdmin } from "../lib/auth";
import { getAdminMaintenanceStatus, startAdminMaintenance } from "../lib/admin-maintenance";
import { storeKnowledgeUpload } from "../lib/knowledge-upload";
import { addTrainingRecord, loadTrainingRecords } from "../lib/training-data";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(attachUser, requireAdmin);

router.get("/admin/overview", async (_req, res) => {
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

  const donationsCountResult = await pool.query<{ count: string }>(
    "SELECT count(*) FROM stripe_events WHERE type = 'checkout.session.completed'",
  );
  const donationsTotalResult = await pool.query<{ total: string | null }>(
    `SELECT sum((payload->>'amountCents')::int) AS total
     FROM stripe_events WHERE type = 'checkout.session.completed'`,
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

router.get("/admin/documents", async (_req, res) => {
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

router.post("/admin/documents/upload", upload.single("file"), async (req, res) => {
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

router.patch("/admin/documents/:id", async (req, res) => {
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

router.get("/admin/maintenance", (_req, res) => {
  const data = GetAdminMaintenanceResponse.parse(getAdminMaintenanceStatus());
  res.json(data);
});

router.post("/admin/maintenance", (req, res) => {
  const body = StartAdminMaintenanceBody.parse(req.body);
  const result = startAdminMaintenance(body.action, req.user!.email);
  const data = StartAdminMaintenanceResponse.parse(result);
  res.json(data);
});

router.get("/admin/training", async (req, res) => {
  const records = await loadTrainingRecords();
  const limit = 50;
  const data = ListAdminTrainingResponse.parse({
    records: records.slice(0, limit),
    total: records.length,
  });
  res.json(data);
});

router.post("/admin/training", async (req, res) => {
  const body = AddAdminTrainingBody.parse(req.body);
  await addTrainingRecord(body.question, body.answer);
  const data = AddAdminTrainingResponse.parse({ ok: true });
  res.status(201).json(data);
});

export default router;
