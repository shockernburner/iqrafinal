import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// A long-running server (e.g. a Reserved VM) keeps connections open for days,
// and the database drops them when it restarts or suspends after a few idle
// minutes. pg reports that as an 'error' event; with no listener Node treats it
// as an uncaught exception and the whole server exits. Log it instead: the pool
// discards the broken connection and opens a fresh one on the next query, and a
// query running on a dropped connection still fails normally for its caller.
pool.on("error", (err) => {
  console.error("[db] idle database connection dropped:", err.message);
});
// Connections that are checked out (e.g. held while a large PDF is indexed) lose
// the pool's idle listener, so give every connection its own.
pool.on("connect", (client) => {
  client.on("error", (err) => {
    console.error("[db] database connection error:", err.message);
  });
});
export const db = drizzle(pool, { schema });

export * from "./schema";
