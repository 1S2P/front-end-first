import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
console.log("Checking auth users...");
const { data, error } = await supabase.auth.admin.listUsers();
if (error) {
  console.error("Error listing users:", JSON.stringify(error));
} else {
  console.log("Total users:", data.users.length);
  data.users.forEach(u => console.log(" -", u.id, u.email));
}

console.log("\nChecking profiles table...");
const { data: profiles, error: pe } = await supabase.from("profiles").select("id, email, role");
if (pe) console.error("Profiles error:", JSON.stringify(pe));
else profiles.forEach(p => console.log(" -", p.id, p.email, p.role));
