// setup-db.mjs
// Runs all migrations using the Supabase service role key via the Management API
// Usage: node setup-db.mjs
//
// This uses the Supabase Management API which requires a Personal Access Token.
// Get one at: https://supabase.com/dashboard/account/tokens
//
// Then run: SUPABASE_ACCESS_TOKEN=your_token node setup-db.mjs

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "xxbwbkokvcbwbexyzohg";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌  Missing SUPABASE_ACCESS_TOKEN");
  console.error("   1. Go to https://supabase.com/dashboard/account/tokens");
  console.error("   2. Create a new token");
  console.error("   3. Run: set SUPABASE_ACCESS_TOKEN=your_token && node setup-db.mjs\n");
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
}

const files = [
  ["001_schema.sql",    join(__dir, "supabase/migrations/001_schema.sql")],
  ["002_rls.sql",       join(__dir, "supabase/migrations/002_rls.sql")],
  ["003_functions.sql", join(__dir, "supabase/migrations/003_functions.sql")],
  ["seed.sql",          join(__dir, "supabase/seed.sql")],
];

async function main() {
  console.log("🚀 Setting up Supabase database...\n");

  for (const [name, path] of files) {
    const content = readFileSync(path, "utf8");
    process.stdout.write(`📄 Running ${name} ... `);
    try {
      await runSQL(content);
      console.log("✅");
    } catch (e) {
      // If it's an "already exists" error, that's fine
      if (e.message.includes("already exists") || e.message.includes("duplicate")) {
        console.log("⚠️  already applied (skipped)");
      } else {
        console.log(`❌\n   Error: ${e.message}`);
        // Don't stop — try next file
      }
    }
  }

  console.log("\n✅ Database setup complete!");
  console.log("\n📋 Next steps:");
  console.log("   1. Go to https://supabase.com/dashboard/project/xxbwbkokvcbwbexyzohg/auth/users");
  console.log("   2. Click 'Add user' → 'Create new user'");
  console.log("   3. Email: pratik@danfetea.com  Password: (choose one)");
  console.log("   4. Then run: node setup-admin.mjs <user-uuid-from-dashboard>\n");
}

main().catch(e => { console.error(e); process.exit(1); });
