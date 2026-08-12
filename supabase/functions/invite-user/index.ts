import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } },
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { data: profile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const { email, name, role, departmentId, brandIds } = await req.json();

    // Use service role to invite
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { data: { name } },
    );
    if (inviteError) throw inviteError;

    // Update profile with role and department
    await adminClient.from("profiles").update({
      name,
      role,
      department_id: departmentId,
      initials: name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    }).eq("id", inviteData.user.id);

    // Add brand memberships
    if (brandIds?.length > 0) {
      await adminClient.from("profile_brands").insert(
        brandIds.map((brand_id: string) => ({ profile_id: inviteData.user.id, brand_id })),
      );
    }

    return new Response(JSON.stringify({ id: inviteData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
