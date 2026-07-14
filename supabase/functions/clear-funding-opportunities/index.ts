import { createClient } from "npm:@supabase/supabase-js@2";

// Inline CORS header (avoid shared import bundling issues)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Clear all funding_opportunities (all sources).
// This forces the next AI scan to recompute matches from a fresh opportunity dataset.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Optional: allow an explicit flag to prevent accidental deletion
    const body = await req.json().catch(() => ({} as { confirm?: boolean }));
    const confirm = (body?.confirm ?? true) as boolean;
    if (!confirm) return Response.json({ ok: false, message: "confirm=true required" }, { headers: corsHeaders });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supa.from("funding_opportunities").delete().neq("id", "");
    if (error) throw error;

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
});

