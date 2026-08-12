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

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

async function createUser(email, name, role) {
  const r = await fetch(BASE + "/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV },
    body: JSON.stringify({ email, password: process.env.TEST_USER_PASSWORD, email_confirm: true, user_metadata: { name } }),
  });
  const u = await r.json();
  await fetch(BASE + "/rest/v1/profiles?id=eq." + u.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV, Prefer: "return=representation" },
    body: JSON.stringify({ role, department_id: "seo" }),
  });
  return u.id;
}
if (!process.env.TEST_USER_PASSWORD) {
  throw new Error("TEST_USER_PASSWORD is required");
}

async function signIn(email) {
  const s = await fetch(BASE + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY },
    body: JSON.stringify({ email, password: process.env.TEST_USER_PASSWORD }),
  });
  const sj = await s.json();
  if (!sj.access_token) throw new Error("signin failed " + email + " " + (sj.error_description || sj.msg));
  return { token: sj.access_token, userId: sj.user.id };
}

async function callServerFn(functionId, data) {
  const { toJSONAsync } = await import("seroval");
  const enc = await toJSONAsync({ data });
  const r = await fetch("http://localhost:8080/_serverFn/" + functionId, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tsr-serverFn": "true", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify(enc),
  });
  const text = await r.text();
  return { status: r.status, body: text };
}

(async () => {
  const ts = Date.now();
  const adminId = await createUser("adm-" + ts + "@danfetea.com", "Admin E2E", "admin");
  const workerId = await createUser("wrk-" + ts + "@danfetea.com", "Worker E2E", "team_member");
  const admin = await signIn("adm-" + ts + "@danfetea.com");
  const worker = await signIn("wrk-" + ts + "@danfetea.com");

  // create a project + task assigned to worker
  const proj = await fetch(BASE + "/rest/v1/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV, Prefer: "return=representation" },
    body: JSON.stringify({ name: "E2E Project", brand_id: "danfe", created_by: adminId }),
  });
  const projRow = (await proj.json())[0];
  const task = await fetch(BASE + "/rest/v1/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV, Prefer: "return=representation" },
    body: JSON.stringify({
      title: "E2E Task", description: "test", priority: "medium", brand_id: "danfe",
      project_id: projRow.id, department_id: "seo", assigned_to: workerId,
      status: "in_progress", approval_required: true, workflow_step_index: 0,
    }),
  });
  const taskRow = (await task.json())[0];
  const taskId = taskRow.id;
  console.log("task created:", taskId);

  // 1. COMMENT (client path) — insert comment + activity with worker token
  const hdrs = { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + worker.token };
  const c1 = await fetch(BASE + "/rest/v1/task_comments", { method: "POST", headers: hdrs, body: JSON.stringify({ task_id: taskId, user_id: worker.userId, text: "hello from worker" }) });
  const a1 = await fetch(BASE + "/rest/v1/task_activities", { method: "POST", headers: hdrs, body: JSON.stringify({ task_id: taskId, action: "comment_added", user_id: worker.userId, description: "Comment added" }) });
  console.log("comment insert:", c1.status, "activity insert:", a1.status);

  // 2. UPLOAD (server fn) — as worker
  const content = Buffer.from("e2e file content").toString("base64");
  const fid = b64({ file: "/src/lib/server-functions.ts?tss-serverfn-split", export: "uploadTaskAttachment_createServerFn_handler" });
  const up = await callServerFn(fid, {
    accessToken: worker.token, taskId, fileName: "note.txt",
    contentType: "text/plain", content,
  });
  console.log("upload serverfn status:", up.status, "body:", up.body.slice(0, 300));

  // 3. REVIEW request_changes with specific assignee (RPC as admin)
  const rp = await fetch(BASE + "/rest/v1/rpc/review_task", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + admin.token },
    body: JSON.stringify({ p_task_id: taskId, p_action: "request_changes", p_assignee_id: workerId }),
  });
  console.log("review_task status:", rp.status, JSON.stringify(await rp.json()));
  const tAfter = await fetch(BASE + "/rest/v1/tasks?select=status,assigned_to&id=eq." + taskId, {
    headers: { apikey: KEY, Authorization: "Bearer " + admin.token },
  });
  console.log("task after review:", JSON.stringify(await tAfter.json()));

  // cleanup
  await fetch(BASE + "/rest/v1/tasks?id=eq." + taskId, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  await fetch(BASE + "/rest/v1/projects?id=eq." + projRow.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  for (const id of [adminId, workerId]) {
    await fetch(BASE + "/rest/v1/profiles?id=eq." + id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
    await fetch(BASE + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
  }
  console.log("cleanup done");
})();
