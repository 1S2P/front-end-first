const fs = require("fs");
const env = fs
  .readFileSync(".env.local", "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((a, l) => {
    const [k, ...v] = l.split("=");
    a[k.trim()] = v.join("=").trim();
    return a;
  }, {});
const BASE = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
const SRV = env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.TEST_USER_PASSWORD) {
  throw new Error("TEST_USER_PASSWORD is required");
}
function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

(async () => {
  const ts = Date.now();
  const r = await fetch(BASE + "/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV },
    body: JSON.stringify({ email: "wrk2-" + ts + "@danfetea.com", password: process.env.TEST_USER_PASSWORD, email_confirm: true, user_metadata: { name: "Worker2" } }),
  });
  const u = await r.json();
  await fetch(BASE + "/rest/v1/profiles?id=eq." + u.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV },
    body: JSON.stringify({ role: "team_member", department_id: "seo" }),
  });
  const s = await fetch(BASE + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY },
    body: JSON.stringify({ email: "wrk2-" + ts + "@danfetea.com", password: process.env.TEST_USER_PASSWORD }),
  });
  const sj = await s.json();

  const proj = await fetch(BASE + "/rest/v1/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV, Prefer: "return=representation" },
    body: JSON.stringify({ name: "E2E P", brand_id: "danfe", created_by: u.id }),
  });
  const projRow = (await proj.json())[0];
  const task = await fetch(BASE + "/rest/v1/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV, Prefer: "return=representation" },
    body: JSON.stringify({ title: "T", description: "d", priority: "medium", brand_id: "danfe", project_id: projRow.id, department_id: "seo", assigned_to: u.id, status: "in_progress", approval_required: true }),
  });
  const taskRow = (await task.json())[0];

  const fid = b64({ file: "/src/lib/server-functions.ts?tss-serverfn-split", export: "uploadTaskAttachment_createServerFn_handler" });
  const { toJSONAsync } = await import("seroval");
  const enc = await toJSONAsync({ data: { accessToken: sj.access_token, taskId: taskRow.id, fileName: "note.txt", contentType: "text/plain", content: Buffer.from("hello world").toString("base64") } });
  const resp = await fetch("http://localhost:8080/_serverFn/" + fid, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tsr-serverFn": "true", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify(enc),
  });
  const text = await resp.text();
  console.log("status:", resp.status, "ct:", resp.headers.get("content-type"));
  console.log("body:", text.slice(0, 1200));

  // cleanup
  await fetch(BASE + "/rest/v1/tasks?id=eq." + taskRow.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  await fetch(BASE + "/rest/v1/projects?id=eq." + projRow.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  await fetch(BASE + "/rest/v1/profiles?id=eq." + u.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  await fetch(BASE + "/auth/v1/admin/users/" + u.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
})();
