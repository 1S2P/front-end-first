const fs = require("fs");
const path = require("path");
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
const KEY = env.VITE_SUPABASE_ANON_KEY;
const SRV = env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.TEST_USER_PASSWORD) {
  throw new Error("TEST_USER_PASSWORD is required");
}

(async () => {
  const email = "upl-" + Date.now() + "@danfetea.com";
  const r = await fetch(BASE + "/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SRV, Authorization: "Bearer " + SRV },
    body: JSON.stringify({ email, password: process.env.TEST_USER_PASSWORD, email_confirm: true, user_metadata: { name: "Upload Tester" } }),
  });
  const u = await r.json();
  if (!u.id) { console.log("create failed", JSON.stringify(u)); return; }
  const s = await fetch(BASE + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY },
    body: JSON.stringify({ email, password: process.env.TEST_USER_PASSWORD }),
  });
  const sj = await s.json();
  const token = sj.access_token;

  const body = Buffer.from("hello world");
  const up = await fetch(BASE + "/storage/v1/object/task-attachments/tasks/00000000-0000-0000-0000-000000000000/test.txt", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, apikey: KEY, "Content-Type": "text/plain" },
    body,
  });
  console.log("upload status:", up.status, JSON.stringify(await up.json()));

  // cleanup user
  await fetch(BASE + "/auth/v1/admin/users/" + u.id, { method: "DELETE", headers: { apikey: SRV, Authorization: "Bearer " + SRV } });
})();
