const fs = require("fs");
(async () => {
  const { toJSONAsync } = await import("seroval");
  const env = fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((a, l) => {
      const [k, ...v] = l.split("=");
      a[k.trim()] = v.join("=").trim();
      return a;
    }, {});
  const fid = Buffer.from(JSON.stringify({ file: "/src/lib/server-functions.ts?tss-serverfn-split", export: "inviteEmployee_createServerFn_handler" })).toString("base64");
  const enc = await toJSONAsync({ data: { accessToken: "x", email: "a@b.c", name: "A", password: "p", role: "team_member", departmentId: "d", brandIds: [] } });
  const r = await fetch("http://localhost:8080/_serverFn/" + fid, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tsr-serverFn": "true", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify(enc),
  });
  console.log("inviteEmployee status:", r.status, (await r.text()).slice(0, 200));
})();
