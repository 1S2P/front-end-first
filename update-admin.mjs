const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}
const MGMT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!MGMT_TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const SUPABASE_URL = "https://xxbwbkokvcbwbexyzohg.supabase.co";
const PROJECT_REF  = "xxbwbkokvcbwbexyzohg";
const USER_ID      = "be6dfc04-ba94-4f84-8291-48b04fe66184";
const NEW_EMAIL    = "danfe@danfetea.com";
const NEW_PASSWORD = process.env.ADMIN_PASSWORD;

if (!NEW_PASSWORD) {
  throw new Error("ADMIN_PASSWORD is required");
}

// 1. Update auth user (email + password)
const r1 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
  method: "PUT",
  headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "apikey": SERVICE_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: NEW_EMAIL, password: NEW_PASSWORD, email_confirm: true }),
});
const d1 = await r1.json();
console.log(r1.ok ? `✅ Auth updated → ${d1.email}` : `❌ Auth error (${r1.status}): ${JSON.stringify(d1)}`);

// 2. Update profiles table via Management API SQL
const r2 = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${MGMT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: `UPDATE profiles SET email = '${NEW_EMAIL}' WHERE id = '${USER_ID}';` }),
});
const d2 = await r2.json();
console.log(r2.ok ? `✅ Profile email updated` : `❌ Profile error: ${JSON.stringify(d2)}`);

// 3. Verify
const r3 = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${MGMT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: `SELECT id, email, role FROM profiles WHERE id = '${USER_ID}';` }),
});
const d3 = await r3.json();
console.log("Profile:", JSON.stringify(d3));
