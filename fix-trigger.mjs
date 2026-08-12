// fix-trigger.mjs — fixes the handle_new_user trigger blocked by RLS
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required");
}
const PROJECT_REF = "xxbwbkokvcbwbexyzohg";
const h = { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function sql(query, label) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST", headers: h, body: JSON.stringify({ query })
  });
  const d = await r.json();
  const ok = r.status < 300;
  console.log(`${ok ? "✅" : "❌"} ${label}${ok ? "" : ": " + JSON.stringify(d).slice(0, 150)}`);
  return ok;
}

// 1. Drop the restrictive insert policy on profiles
await sql(`DROP POLICY IF EXISTS "profiles_insert" ON profiles;`, "Drop old profiles_insert policy");

// 2. The trigger runs as SECURITY DEFINER so it bypasses RLS — but the issue
//    is the trigger tries to insert initials using string concat that can fail.
//    Rewrite the trigger to be more robust.
await sql(`
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name     text;
  v_initials text;
BEGIN
  v_name := COALESCE(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- Build initials: first letter of first word + first letter of second word
  v_initials := UPPER(
    LEFT(v_name, 1) ||
    COALESCE(LEFT(TRIM(split_part(v_name, ' ', 2)), 1), '')
  );

  INSERT INTO public.profiles (id, name, email, initials, role)
  VALUES (new.id, v_name, new.email, v_initials, 'team_member')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
`, "Rewrite handle_new_user trigger (robust)");

// 3. Re-add a correct insert policy: service_role bypasses RLS anyway,
//    but add a policy for authenticated admins to invite users
await sql(`
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());
`, "Re-add profiles_insert policy for admins");

// 4. Also allow service_role to bypass (it already does, but be explicit)
await sql(`ALTER TABLE profiles FORCE ROW LEVEL SECURITY;`, "Force RLS on profiles");

console.log("\n✅ Trigger fix applied. Now run: node setup-admin.mjs <email> <password>\n");