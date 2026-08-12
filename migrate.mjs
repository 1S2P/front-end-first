// migrate.mjs
// Runs all migrations using the Supabase Management API
// 
// USAGE:
//   node migrate.mjs <personal-access-token>
//
// Get your token at:
//   https://supabase.com/dashboard/account/tokens
//   → "Generate new token" → copy it → paste here

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "xxbwbkokvcbwbexyzohg";
const token = process.argv[2];

if (!token) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Supabase Database Migration Runner                 ║
╚══════════════════════════════════════════════════════════════╝

  This script needs your Supabase Personal Access Token.

  Steps:
  1. Open: https://supabase.com/dashboard/account/tokens
  2. Click "Generate new token"
  3. Name it anything (e.g. "local-dev")
  4. Copy the token
  5. Run: node migrate.mjs <paste-token-here>

`);
  process.exit(1);
}

async function runSQL(sql, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!res.ok) {
    const msg = data?.message || data?.error || text;
    // Treat "already exists" as success
    if (
      msg.includes("already exists") ||
      msg.includes("duplicate key") ||
      msg.includes("already been added")
    ) {
      return { skipped: true, msg };
    }
    throw new Error(msg);
  }
  return { ok: true };
}

const files = [
  ["001_schema.sql",    join(__dir, "supabase/migrations/001_schema.sql")],
  ["002_rls.sql",       join(__dir, "supabase/migrations/002_rls.sql")],
  ["003_functions.sql", join(__dir, "supabase/migrations/003_functions.sql")],
  ["seed.sql",          join(__dir, "supabase/seed.sql")],
];

async function main() {
  // Verify token works
  const check = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!check.ok) {
    console.error("❌ Invalid token or project not found. Check your Personal Access Token.");
    process.exit(1);
  }
  const proj = await check.json();
  console.log(`\n✅ Connected to project: ${proj.name || PROJECT_REF}\n`);

  for (const [name, path] of files) {
    const content = readFileSync(path, "utf8");
    process.stdout.write(`📄 ${name} ... `);
    try {
      const result = await runSQL(content, name);
      if (result.skipped) {
        console.log("⚠️  already applied");
      } else {
        console.log("✅");
      }
    } catch (e) {
      console.log(`❌\n   ${e.message}\n`);
      // For schema errors, try statement by statement
      if (name.endsWith("schema.sql") || name.endsWith("rls.sql")) {
        console.log("   Retrying statement by statement...");
        const stmts = content.split(/;\s*\n/).map(s => s.trim()).filter(s => s && !s.startsWith("--"));
        let ok = 0, skip = 0, fail = 0;
        for (const stmt of stmts) {
          try {
            const r = await runSQL(stmt + ";", "");
            if (r.skipped) skip++; else ok++;
          } catch (e2) {
            fail++;
            if (!e2.message.includes("already exists")) {
              console.log(`   ⚠️  ${stmt.slice(0, 60)}... → ${e2.message}`);
            }
          }
        }
        console.log(`   Result: ${ok} ok, ${skip} skipped, ${fail} failed`);
      }
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  ✅ Setup Complete!                          ║
╚══════════════════════════════════════════════════════════════╝

Next steps:

  1. Create your admin user:
     → https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users
     → "Add user" → "Create new user"
     → Email: pratik@danfetea.com
     → Set a password

  2. Copy the UUID from the users list, then run:
     node setup-admin.mjs <uuid>

  3. Start the app:
     npm run dev

  4. Login at http://localhost:3000/login
`);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
