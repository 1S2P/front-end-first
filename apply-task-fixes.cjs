const fs = require("fs");
const path = require("path");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const REF = "xxbwbkokvcbwbexyzohg";
const h = { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" };

async function sql(query, label) {
  const r = await fetch("https://api.supabase.com/v1/projects/" + REF + "/database/query", {
    method: "POST",
    headers: h,
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  console.log(`${r.status < 300 ? "OK" : "ERR"} [${label}]`, r.status < 300 ? "" : JSON.stringify(d).slice(0, 300));
  return r.status < 300;
}

(async () => {
  const ok = await sql(fs.readFileSync(path.join(__dirname, "supabase/migrations/004_task_fixes.sql"), "utf8"), "004_task_fixes.sql");
  if (ok) {
    await sql("select policyname from pg_policies where tablename='task_activities'", "task_activities policies");
    await sql("select proname, pg_get_function_identity_arguments(oid) as args from pg_proc where proname='review_task'", "review_task signature");
  }
})();
