import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/authz";
import { getPgPool } from "@/lib/db";

const allowedActions = new Set(["retry", "deactivate", "activate", "delete"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const { id } = await params;
  const { action } = (await request.json()) as { action?: string };
  if (!action || !allowedActions.has(action)) {
    return NextResponse.json({ error: "Unsupported document action." }, { status: 400 });
  }

  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const document = await client.query<{ current_version_id: string | null }>(
      "SELECT current_version_id FROM documents WHERE id = $1 AND status <> 'deleted' FOR UPDATE",
      [id],
    );
    const currentVersionId = document.rows[0]?.current_version_id;
    if (!document.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (action === "retry") {
      if (!currentVersionId) throw new Error("No current version exists to retry.");
      await client.query("UPDATE document_versions SET status = 'queued' WHERE id = $1", [currentVersionId]);
      await client.query("INSERT INTO ingestion_jobs (document_version_id) VALUES ($1)", [currentVersionId]);
    }

    if (action === "deactivate") {
      await client.query("UPDATE documents SET status = 'inactive', updated_at = now() WHERE id = $1", [id]);
      if (currentVersionId) {
        await client.query("UPDATE document_versions SET status = 'inactive' WHERE id = $1", [currentVersionId]);
        await client.query("UPDATE document_chunks SET is_active = false WHERE document_version_id = $1", [currentVersionId]);
      }
    }

    if (action === "activate") {
      if (!currentVersionId) throw new Error("No current version exists to activate.");
      await client.query("UPDATE documents SET status = 'active', updated_at = now() WHERE id = $1", [id]);
      await client.query("UPDATE document_versions SET status = 'active' WHERE id = $1", [currentVersionId]);
      await client.query("UPDATE document_chunks SET is_active = true WHERE document_version_id = $1", [currentVersionId]);
    }

    if (action === "delete") {
      await client.query("UPDATE documents SET status = 'deleted', updated_at = now() WHERE id = $1", [id]);
      if (currentVersionId) {
        await client.query("UPDATE document_versions SET status = 'deleted' WHERE document_id = $1", [id]);
        await client.query("DELETE FROM document_chunks WHERE document_id = $1", [id]);
      }
    }

    await client.query(
      `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'document', $3, '{}'::jsonb)`,
      [session.user.id, `knowledge_document_${action}`, id],
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Document action failed." }, { status: 400 });
  } finally {
    client.release();
  }
}
