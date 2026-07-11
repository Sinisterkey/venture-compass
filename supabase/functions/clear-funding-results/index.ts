import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai.ts";

// Clear funding_matches for a single organization (owner-scoped).
// Does NOT delete funding_opportunities.
// This prevents showing stale IFRC opportunities while keeping the opportunity cache intact.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find the owning user id for this organization
    const { data: org, error: orgErr } = await supa
      .from("organizations")
      .select("id, owner_id")
      .eq("id", organization_id)
      .maybeSingle();

    if (orgErr) throw orgErr;
    if (!org) throw new Error("Organization not found");

    // Delete only matches for that organization.
    const { error: delErr } = await supa
      .from("funding_matches")
      .delete()
      .eq("organization_id", organization_id);

    if (delErr) throw delErr;

    return Response.json(
      { ok: true, cleared_organization_id: organization_id },
      { headers: corsHeaders },
    );
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
});

