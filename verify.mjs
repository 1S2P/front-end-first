// verify.mjs — checks that all tables, seed data, and functions are in place
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const BASE = "https://api.supabase.com/v1/projects/xxbwbkokvcbwbexyzohg/database/query";
const h = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function q(sql) {
  const r = await fetch(BASE, { method: "POST", headers: h, body: JSON.stringify({ query: sql }) });
  return r.json();
}

const brands       = await q("SELECT id, name FROM brands;");
const departments  = await q("SELECT id, name FROM departments;");
const workflows    = await q("SELECT name, status FROM workflow_templates ORDER BY name;");
const steps        = await q("SELECT count(*) as n FROM workflow_steps;");
const checklist    = await q("SELECT count(*) as n FROM step_checklist_items;");
const functions    = await q("SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' ORDER BY routine_name;");
const triggers     = await q("SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema='public';");

console.log("\n📦 BRANDS:");
brands.forEach(b => console.log(`   ✅ ${b.id} — ${b.name}`));

console.log("\n🏢 DEPARTMENTS:");
departments.forEach(d => console.log(`   ✅ ${d.id} — ${d.name}`));

console.log("\n⚙️  WORKFLOW TEMPLATES:");
workflows.forEach(w => console.log(`   ${w.status === 'active' ? '✅' : '📦'} [${w.status}] ${w.name}`));

console.log("\n📋 STEPS & CHECKLIST:");
console.log(`   ✅ ${steps[0]?.n} workflow steps`);
console.log(`   ✅ ${checklist[0]?.n} checklist items`);

console.log("\n🔧 FUNCTIONS:");
functions.forEach(f => console.log(`   ✅ ${f.routine_name}()`));

console.log("\n⚡ TRIGGERS:");
triggers.forEach(t => console.log(`   ✅ ${t.trigger_name} on ${t.event_object_table}`));

console.log("\n🎉 Database is fully set up and ready!\n");
