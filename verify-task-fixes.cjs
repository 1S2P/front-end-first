const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const REF = "xxbwbkokvcbwbexyzohg";
const h = { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" };
(async () => {
  const q = "select tablename, policyname from pg_policies where tablename='task_activities'";
  const r = await fetch("https://api.supabase.com/v1/projects/" + REF + "/database/query", { method: "POST", headers: h, body: JSON.stringify({ query: q }) });
  console.log("policies:", JSON.stringify(await r.json()));
  const q2 = "select proname, pg_get_function_identity_arguments(oid) as args from pg_proc where proname='review_task'";
  const r2 = await fetch("https://api.supabase.com/v1/projects/" + REF + "/database/query", { method: "POST", headers: h, body: JSON.stringify({ query: q2 }) });
  console.log("review_task:", JSON.stringify(await r2.json()));
})();
