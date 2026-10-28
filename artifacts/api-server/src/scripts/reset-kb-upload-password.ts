import { pool } from "@workspace/db";

// Clears a knowledge-base uploader's second password (e.g. when forgotten), so
// the next upload attempt prompts them to create a new one.
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: tsx src/scripts/reset-kb-upload-password.ts <email>");
    process.exit(1);
  }

  const result = await pool.query(
    `DELETE FROM kb_upload_credentials WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
    [email],
  );
  await pool.query(
    `DELETE FROM kb_upload_grants WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
    [email],
  );

  console.log(
    result.rowCount
      ? `Upload password cleared for ${email}. They will be asked to set a new one on their next upload.`
      : `No upload password was set for ${email}.`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
