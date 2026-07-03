import process from "node:process";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
  return value;
}

const databaseUrl = required("DATABASE_URL");
const email = required("IQRA_ADMIN_EMAIL").trim().toLowerCase();
const password = required("IQRA_ADMIN_PASSWORD");
const name = process.env.IQRA_ADMIN_NAME?.trim() || "IQRA Admin";

if (!/^\S+@\S+\.\S+$/u.test(email)) {
  console.error("IQRA_ADMIN_EMAIL must be a valid email address.");
  process.exit(1);
}

if (password.length < 16) {
  console.error("IQRA_ADMIN_PASSWORD must be at least 16 characters.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = 'admin',
           is_active = true,
           updated_at = now()
     RETURNING id, email, role`,
    [email, name, passwordHash],
  );
  await pool.query(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'admin_created_or_rotated', 'user', $2, $3::jsonb)`,
    [result.rows[0].id, result.rows[0].email, JSON.stringify({ source: "create-admin-script" })],
  );
  console.log(`Admin ready: ${result.rows[0].email}`);
} finally {
  await pool.end();
}
