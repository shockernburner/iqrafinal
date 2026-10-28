import { Router, type IRouter, type RequestHandler } from "express";
import { pool } from "@workspace/db";
import {
  GetSiteContentResponse,
  GetSiteStatsResponse,
  RecordVisitResponse,
  GetDonorsResponse,
  GetCorporateSponsorsResponse,
} from "@workspace/api-zod";
import { corporateSponsorLogoUrl } from "../lib/corporate-sponsors";

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
  // Record one event row per visit for the admin Growth time-series. This is
  // best-effort: a failure here must never break the visit response or leave the
  // page_visits counter and event log inconsistent, so it runs on its own and
  // swallows errors rather than joining the Promise.all below.
  pool
    .query("INSERT INTO page_visit_events DEFAULT VALUES")
    .catch((err) => console.error("page_visit_events insert failed", err));

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

// Stripe donors (one entry per donor, keyed by their first donation) plus donors
// added manually by admins, listed first come, first listed. Amounts are never
// exposed.
const listDonors: RequestHandler = async (_req, res) => {
  const result = await pool.query<{ name: string | null; anonymous: boolean; country: string | null }>(
    `WITH firsts AS (
       SELECT user_id, MIN(created_at) AS first_at
       FROM donations
       GROUP BY user_id
     ),
     latest AS (
       SELECT DISTINCT ON (user_id) user_id, anonymous, country
       FROM donations
       ORDER BY user_id, created_at DESC
     ),
     stripe_donors AS (
       SELECT u.name AS name, l.anonymous AS anonymous, l.country AS country, f.first_at AS first_at, f.first_at AS tiebreak
       FROM firsts f
       JOIN latest l ON l.user_id IS NOT DISTINCT FROM f.user_id
       LEFT JOIN users u ON u.id = f.user_id
     ),
     manual AS (
       SELECT name, anonymous, country, donated_on::timestamptz AS first_at, created_at AS tiebreak
       FROM manual_donors
     )
     SELECT name, anonymous, country
     FROM (SELECT * FROM stripe_donors UNION ALL SELECT * FROM manual) d
     ORDER BY first_at ASC, tiebreak ASC`,
  );

  const data = GetDonorsResponse.parse({
    donors: result.rows.map((row) => ({
      displayName: row.anonymous ? null : row.name,
      country: row.country,
      anonymous: row.anonymous,
    })),
  });
  res.json(data);
};

router.get("/donors", listDonors);
// Legacy path from before donors and corporate sponsors were split.
router.get("/sponsors", listDonors);

router.get("/corporate-sponsors", async (_req, res) => {
  const result = await pool.query<{ id: string; name: string; website_url: string | null }>(
    `SELECT id, name, website_url FROM corporate_sponsors ORDER BY sponsored_since, created_at`,
  );
  const data = GetCorporateSponsorsResponse.parse({
    sponsors: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      websiteUrl: row.website_url,
      logoUrl: corporateSponsorLogoUrl(row.id),
    })),
  });
  res.json(data);
});

router.get("/corporate-sponsors/:id/logo", async (req, res) => {
  const result = await pool.query<{ logo: Buffer; logo_mime: string }>(
    "SELECT logo, logo_mime FROM corporate_sponsors WHERE id::text = $1",
    [req.params.id],
  );
  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ error: "Logo not found." });
    return;
  }
  // Sponsors are never edited in place (delete + re-add gives a new id), so a
  // logo URL's bytes never change.
  res.set({
    "Content-Type": row.logo_mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  res.send(row.logo);
});

export default router;
