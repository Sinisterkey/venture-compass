import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, callLovableAI } from "../_shared/ai.ts";

// Compute AI match score between an investor and a single organization
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { investor_user_id, organization_id } = await req.json();
    if (!investor_user_id || !organization_id) throw new Error("investor_user_id and organization_id required");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: inv }, { data: org }] = await Promise.all([
      supa.from("investor_profiles").select("*").eq("user_id", investor_user_id).maybeSingle(),
      supa.from("organizations").select("*").eq("id", organization_id).maybeSingle(),
    ]);
    if (!org) throw new Error("Organization not found");

    const schema = {
      type: "object",
      properties: {
        score: { type: "integer", description: "0-100 compatibility" },
        reasons: { type: "array", items: { type: "string" }, description: "3-6 concrete reasons" },
      },
      required: ["score", "reasons"],
    };

    const payload = JSON.stringify({
      investor: inv ? {
        type: inv.investor_type, focus: inv.investment_focus,
        sdgs: inv.preferred_sdgs, countries: inv.preferred_countries,
        beneficiaries: inv.preferred_beneficiaries,
        funding_range: [inv.min_investment, inv.max_investment],
        bio: inv.bio,
      } : { note: "investor has not set preferences" },
      organization: {
        name: org.name, sector: org.sector, country: org.country,
        sdgs: org.sdgs, beneficiary_type: org.beneficiary_type,
        impact_area: org.impact_area, stage: org.stage,
        funding_required: org.funding_required, mission: org.mission,
      },
    });

    const result = await callLovableAI([
      { role: "system", content: "You match impact investors with NGOs. Compute a 0-100 compatibility score. Reasons must be specific (cite sector, SDG, country, funding range, or beneficiary alignment). Avoid generic language." },
      { role: "user", content: payload },
    ], schema);

    return Response.json(result, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
