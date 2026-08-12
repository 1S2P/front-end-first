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
  console.log(`${r.status < 300 ? "OK" : "ERR"} [${label}]`, r.status < 300 ? "" : JSON.stringify(d).slice(0, 300));
  return { ok: r.status < 300, data: d };
}

(async () => {
  const t = await sql("select policyname from pg_policies where tablename='task_activities'", "task_activities policies");
  console.log("  ->", JSON.stringify(t.data));

  const s = await sql("select policyname from pg_policies where schemaname='storage' and tablename='objects'", "storage policies (before)");
  console.log("  ->", JSON.stringify(s.data));

  await sql(
    `set role supabase_storage_admin;
     create policy "task_attachments_upload" on storage.objects
       for insert to authenticated
       with check (bucket_id = 'task-attachments');
     create policy "task_attachments_read" on storage.objects
       for select to authenticated
       using (bucket_id = 'task-attachments');
     reset role;`,
    "storage policies (set role)",
  );

  const s2 = await sql("select policyname from pg_policies where schemaname='storage' and tablename='objects'", "storage policies (after)");
  console.log("  ->", JSON.stringify(s2.data));
})();
