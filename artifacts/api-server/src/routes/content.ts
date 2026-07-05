import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  GetSiteContentResponse,
  GetSiteStatsResponse,
  RecordVisitResponse,
  GetSponsorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function loadContent(): Promise<Record<string, unknown>> {
  const result = await pool.query<{ key: string; value: unknown }>(
    "SELECT key, value FROM site_content",
  );
  const content: Record<string, unknown> = {};
  for (const row of result.rows) content[row.key] = row.value;
  return content;
}

router.get("/content", async (_req, res) => {
  const data = GetSiteContentResponse.parse(await loadContent());
  res.json(data);
});

router.get("/stats", async (_req, res) => {
  const [visits, users] = await Promise.all([
    pool.query<{ count: string }>("SELECT count FROM site_stats WHERE key = 'page_visits'"),
    pool.query<{ count: string }>("SELECT count(*) FROM users"),
  ]);
  const data = GetSiteStatsResponse.parse({
    pageVisits: Number(visits.rows[0]?.count ?? 0),
    registeredUsers: Number(users.rows[0]?.count ?? 0),
  });
  res.json(data);
});

router.post("/visit", async (_req, res) => {
  const [visits, users] = await Promise.all([
    pool.query<{ count: string }>(
      `INSERT INTO site_stats (key, count) VALUES ('page_visits', 1)
       ON CONFLICT (key) DO UPDATE SET count = site_stats.count + 1, updated_at = now()
       RETURNING count`,
    ),
    pool.query<{ count: string }>("SELECT count(*) FROM users"),
  ]);
  const data = RecordVisitResponse.parse({
    pageVisits: Number(visits.rows[0]?.count ?? 0),
    registeredUsers: Number(users.rows[0]?.count ?? 0),
  });
  res.json(data);
});

router.get("/sponsors", async (_req, res) => {
  // Aggregate per donor (summing all their donations) and rank high → low.
  // Amounts are used only for ordering and never exposed in the response.
  const result = await pool.query<{ name: string | null; anonymous: boolean; country: string | null }>(
    `WITH agg AS (
       SELECT user_id, SUM(amount_cents) AS total
       FROM donations
       GROUP BY user_id
     ),
     latest AS (
       SELECT DISTINCT ON (user_id) user_id, anonymous, country
       FROM donations
       ORDER BY user_id, created_at DESC
     )
     SELECT u.name AS name, l.anonymous AS anonymous, l.country AS country
     FROM agg a
     JOIN latest l ON l.user_id IS NOT DISTINCT FROM a.user_id
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.total DESC NULLS LAST`,
  );

  const data = GetSponsorsResponse.parse({
    sponsors: result.rows.map((row) => ({
      displayName: row.anonymous ? null : row.name,
      country: row.country,
      anonymous: row.anonymous,
    })),
  });
  res.json(data);
});

export default router;
