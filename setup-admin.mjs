// setup-admin.mjs — creates admin user via Supabase Auth Admin REST API directly
// Usage: node setup-admin.mjs <email> <password>

const SUPABASE_URL = "https://xxbwbkokvcbwbexyzohg.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}
const MGMT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!MGMT_TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const PROJECT_REF  = "xxbwbkokvcbwbexyzohg";

const email    = process.argv[2] || "pratik@danfetea.com";
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!password) {
  throw new Error("ADMIN_PASSWORD is required");
}

const authHeaders  = { "Authorization": `Bearer ${SERVICE_KEY}`,  "Content-Type": "application/json", "apikey": SERVICE_KEY };
const mgmtHeaders  = { "Authorization": `Bearer ${MGMT_TOKEN}`,   "Content-Type": "application/json" };

async function post(url, headers, body) {
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, ok: r.ok, json };
}

async function runSQL(sql) {
  return post(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, mgmtHeaders, { query: sql });
}

async function main() {
  console.log(`\n🔧 Creating admin: ${email}\n`);

  // ── Step 1: Create auth user via Admin API ────────────────────────────────
  const { status, ok, json: user } = await post(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    authHeaders,
    { email, password, email_confirm: true, user_metadata: { name: "Pratik R." } }
  );

  let userId;

  if (ok && user.id) {
    userId = user.id;
    console.log(`✅ Auth user created: ${userId}`);
  } else if (status === 422 && JSON.stringify(user).includes("already")) {
    // User exists — list and find
    console.log("⚠️  User already exists, looking up...");
    const { json: list } = await post(`${SUPABASE_URL}/auth/v1/admin/users`, authHeaders, {});
    // GET instead
    const r2 = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers: authHeaders });
    const d2 = await r2.json();
    userId = d2?.users?.[0]?.id || d2?.[0]?.id;
    if (!userId) {
      console.error("❌ Could not find existing user. Response:", JSON.stringify(d2).slice(0, 200));
      process.exit(1);
    }
    console.log(`✅ Found existing user: ${userId}`);
  } else {
    console.error(`❌ Auth user creation failed (HTTP ${status}):`, JSON.stringify(user));
    process.exit(1);
  }

  // ── Step 2: Upsert profile via Management API SQL ─────────────────────────
  const profileSQL = `
    INSERT INTO profiles (id, name, email, initials, role, department_id, avatar_color)
    VALUES ('${userId}', 'Pratik R.', '${email}', 'PR', 'admin', 'seo', 'bg-primary/15 text-primary')
    ON CONFLICT (id) DO UPDATE SET
      name = 'Pratik R.', initials = 'PR', role = 'admin',
      department_id = 'seo', avatar_color = 'bg-primary/15 text-primary';
  `;
  const { ok: p1, json: pe } = await runSQL(profileSQL);
  if (!p1) { console.error("❌ Profile error:", JSON.stringify(pe)); process.exit(1); }
  console.log("✅ Profile set as admin");

  // ── Step 3: Add brand memberships ─────────────────────────────────────────
  const brandSQL = `
    INSERT INTO profile_brands (profile_id, brand_id) VALUES
      ('${userId}', 'danfe'), ('${userId}', 'nte')
    ON CONFLICT DO NOTHING;
  `;
  const { ok: p2, json: be } = await runSQL(brandSQL);
  if (!p2) { console.error("❌ Brand error:", JSON.stringify(be)); process.exit(1); }
  console.log("✅ Added to Danfe Tea + Nepal Tea Exchange");

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  ✅ Admin Ready!                             ║
╚══════════════════════════════════════════════════════════════╝

  Email:    ${email}
  Password: ${password}
  Role:     Admin
  Brands:   Danfe Tea + Nepal Tea Exchange

  Run:  npm run dev
  Then: http://localhost:3000/login
`);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
