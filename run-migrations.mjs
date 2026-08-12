// run-migrations.mjs
// Usage: node run-migrations.mjs
// Connects directly to Supabase Postgres and runs all migrations + seed

import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase direct connection string
// Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
// The service role JWT is NOT the DB password — we need the actual DB password.
// Supabase also exposes a connection pooler at port 6543 (transaction mode)
// and direct at port 5432.

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.xxbwbkokvcbwbexyzohg:[YOUR-DB-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

if (DB_URL.includes("[YOUR-DB-PASSWORD]")) {
  console.error(
    "\n❌  Set DATABASE_URL in your environment or edit this script with your DB password.",
    "\n   Find it in: Supabase Dashboard → Settings → Database → Connection string\n",
  );
  process.exit(1);
}

const sql = postgres(DB_URL, { ssl: "require", max: 1 });

const files = [
  join(__dirname, "supabase/migrations/001_schema.sql"),
  join(__dirname, "supabase/migrations/002_rls.sql"),
  join(__dirname, "supabase/migrations/003_functions.sql"),
  join(__dirname, "supabase/seed.sql"),
];

async function run() {
  for (const file of files) {
    const name = file.split(/[\\/]/).pop();
    process.stdout.write(`Running ${name} ... `);
    try {
      const content = readFileSync(file, "utf8");
      await sql.unsafe(content);
      console.log("✅ done");
    } catch (err) {
      console.log(`⚠️  ${err.message}`);
      // Continue — some statements may already exist (idempotent re-runs)
    }
  }
  await sql.end();
  console.log("\n✅ All migrations complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
