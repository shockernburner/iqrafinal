import { pool } from "@workspace/db";
import { hashPassword } from "../lib/auth";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? email;

  if (!email || !password) {
    console.error("Usage: tsx src/scripts/create-admin.ts <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await pool.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [email.trim().toLowerCase(), name, passwordHash],
  );

  console.log(`Admin user ready: ${email}`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
