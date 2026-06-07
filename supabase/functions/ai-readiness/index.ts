import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, callLovableAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: org, error } = await supa.from("organizations").select("*").eq("id", organization_id).maybeSingle();
    if (error || !org) throw new Error("Organization not found");

    const schema = {
      type: "object",
      properties: {
        score: { type: "integer", description: "0-100 readiness score" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        suggestions: { type: "array", items: { type: "string" } },
      },
      required: ["score", "strengths", "weaknesses", "suggestions"],
    };

    const profileSummary = JSON.stringify({
      name: org.name, mission: org.mission, description: org.short_description,
      sector: org.sector, country: org.country, beneficiaries: org.target_beneficiaries,
      beneficiary_type: org.beneficiary_type, impact_area: org.impact_area,
      sdgs: org.sdgs, stage: org.stage, founded_year: org.founded_year,
      website: org.website, funding_required: org.funding_required,
      has_logo: !!org.logo_url, is_verified: org.is_verified,
    });

    const result = await callLovableAI([
      { role: "system", content: "You are a development sector readiness analyst. Score NGO profiles for funder-readiness on a 0-100 scale. Be honest. Cite specific gaps. Suggestions must be concrete and actionable." },
      { role: "user", content: `Analyze this NGO profile and return readiness score, strengths, weaknesses, and suggestions:\n${profileSummary}` },
    ], schema);

    await supa.from("organizations").update({
      readiness_score: result.score,
      ai_strengths: result.strengths,
      ai_weaknesses: result.weaknesses,
      ai_suggestions: result.suggestions,
      ai_last_analyzed_at: new Date().toISOString(),
    }).eq("id", organization_id);

    return Response.json(result, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
