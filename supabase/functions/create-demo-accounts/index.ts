import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const accounts = [
    { email: "founder@demo.com", password: "demo1234", full_name: "James Mwanza", role: "founder", founder_type: "student" },
    { email: "investor@demo.com", password: "demo1234", full_name: "Amina Osei", role: "investor" },
    { email: "mentor@demo.com", password: "demo1234", full_name: "Dr. Chipo Banda", role: "mentor" },
  ];

  const results = [];

  for (const acc of accounts) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: {
        full_name: acc.full_name,
        role: acc.role,
        founder_type: acc.founder_type || undefined,
      },
    });

    if (error) {
      results.push({ email: acc.email, error: error.message });
    } else {
      results.push({ email: acc.email, success: true, id: data.user.id });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
