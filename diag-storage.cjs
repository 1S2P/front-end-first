const fs = require("fs");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const REF = "xxbwbkokvcbwbexyzohg";
const h = { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" };

async function q(query, label) {
  const r = await fetch("https://api.supabase.com/v1/projects/" + REF + "/database/query", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ query }),
  });
  console.log("[" + label + "]", r.status, JSON.stringify(await r.json()).slice(0, 900));
}

(async () => {
  await q(
    "select c.relname, c.relrowsecurity from pg_class c where c.relname in ('objects','buckets') and c.relnamespace = (select oid from pg_namespace where nspname='storage')",
    "rls",
  );
  await q(
    "select grantee, privilege_type from information_schema.role_table_grants where table_schema='storage' and table_name='objects'",
    "grants",
  );
})();
