import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";
import { startIngestionWorker } from "./lib/ingestion-worker";
import { ensureAdmins } from "./lib/ensure-admins";
import { reconcileDonations } from "./lib/reconcile-donations";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await runMigrations();
  await ensureAdmins();
  startIngestionWorker();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    // Best-effort donation backfill AFTER the server is accepting traffic, so it
    // can never delay readiness (important on autoscaled instances).
    void reconcileDonations().catch((err) => {
      logger.error({ err }, "Donation reconciliation failed");
    });
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
