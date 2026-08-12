const fs = require("fs");
const path = require("path");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const REF = "xxbwbkokvcbwbexyzohg";
const h = { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" };
const env = fs
  .readFileSync(path.join(__dirname, ".env.local"), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((a, l) => {
    const [k, ...v] = l.split("=");
    a[k.trim()] = v.join("=").trim();
    return a;
  }, {});
const BASE = env.VITE_SUPABASE_URL;
const SRV = env.SUPABASE_SERVICE_ROLE_KEY;

async function sql(query, label) {
  const r = await fetch("https://api.supabase.com/v1/projects/" + REF + "/database/query", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  console.log(`[${label}]`, JSON.stringify(d).slice(0, 800));
}

(async () => {
  await sql("select current_user, current_setting('role') as role, (select rolsuper from pg_roles where rolname=current_user) as is_super", "who am i");
  await sql("select rolname, rolsuper, rolinherit from pg_roles where rolname like 'supabase%' or rolname like 'postgres%' or rolname = current_user order by rolname", "roles");
})();
