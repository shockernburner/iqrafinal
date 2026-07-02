import { Pool } from "pg";
import type { PoolClient } from "pg";
import type { QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & { iqraPgPool?: Pool };

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for IQRA Postgres access.");
  }
  return connectionString;
}

export function getPgPool() {
  globalForPg.iqraPgPool ??= new Pool({
    connectionString: getConnectionString(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });
  return globalForPg.iqraPgPool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPgPool().query<T>(text, values);
}

export async function withPgClient<T>(handler: (client: PoolClient) => Promise<T>) {
  const client = await getPgPool().connect();
  try {
    return await handler(client);
  } finally {
    client.release();
  }
}
