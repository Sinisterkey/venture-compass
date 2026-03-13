import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create admin user
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: "admin@launchpad.com",
    password: "admin1234",
    email_confirm: true,
    user_metadata: { full_name: "LaunchPad Admin", role: "admin" },
  });

  if (adminError && !adminError.message.includes("already")) {
    return new Response(JSON.stringify({ error: adminError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = adminUser?.user?.id;
  if (userId) {
    // Insert admin role
    await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    // Insert profile
    await supabase.from("profiles").upsert({ user_id: userId, full_name: "LaunchPad Admin" }, { onConflict: "user_id" });
  }

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
