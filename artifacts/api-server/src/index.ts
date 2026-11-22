import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./db/migrate";
import { startIngestionWorker, stopIngestionWorker } from "./lib/ingestion-worker";
import { pool } from "@workspace/db";
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

// Safety net for a long-running server. A stray rejected promise in background
// work is logged rather than taking the whole site down. A truly uncaught
// exception may leave the process in a bad state, so it is logged and the
// process exits cleanly for Replit to restart it.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection (server kept running)");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception; exiting so the platform restarts the server");
  process.exit(1);
});

async function start() {
  await runMigrations();
  await ensureAdmins();
  startIngestionWorker();

  const server = app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    process.once("SIGTERM", () => shutdown("SIGTERM", server));
    process.once("SIGINT", () => shutdown("SIGINT", server));

    // Best-effort donation backfill AFTER the server is accepting traffic, so it
    // can never delay readiness (important on autoscaled instances).
    void reconcileDonations().catch((err) => {
      logger.error({ err }, "Donation reconciliation failed");
    });
  });
}

// Graceful shutdown when Replit stops or redeploys the server: stop taking new
// requests and indexing jobs, let in-flight requests finish (up to 10 s), then
// close database connections. An interrupted indexing job is reclaimed later
// via its lease.
let shuttingDown = false;
function shutdown(signal: string, server: { close: (cb: () => void) => void }) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down");
  stopIngestionWorker();
  const force = setTimeout(() => process.exit(0), 10_000);
  force.unref();
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
