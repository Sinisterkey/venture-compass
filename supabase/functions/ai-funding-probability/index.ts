import { createClient } from "npm:@supabase/supabase-js@2";

// Inline CORS + Lovable caller (avoid shared import bundling issues)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callLovableAI(messages: any[], schema?: any): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-flash-preview",
    messages,
  };

  if (schema) {
    body.tools = [
      { type: "function", function: { name: "respond", description: "Return the structured response.", parameters: schema } },
    ];
    body.tool_choice = { type: "function", function: { name: "respond" } };
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
  if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
  if (!resp.ok) throw new Error(`AI gateway error ${resp.status}: ${await resp.text()}`);

  const data = await resp.json();
  if (schema) {
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    return JSON.parse(args);
  }
  return data?.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: org } = await supa.from("organizations").select("*").eq("id", organization_id).maybeSingle();
    if (!org) throw new Error("Organization not found");

    // Get count of matching investors
    const { data: investors } = await supa.from("investor_profiles").select(
      "investment_focus,preferred_sdgs,preferred_countries,min_investment,max_investment",
    );

    let aligned = 0;
    for (const i of investors ?? []) {
      const focusMatch = org.sector && (i.investment_focus ?? []).includes(org.sector);
      const sdgMatch = (org.sdgs ?? []).some((s: number) => (i.preferred_sdgs ?? []).includes(s));
      const countryMatch = org.country && (i.preferred_countries ?? []).includes(org.country);
      if (focusMatch || sdgMatch || countryMatch) aligned++;
    }

    const schema = {
      type: "object",
      properties: {
        probability: { type: "integer", description: "0-100 chance of attracting funder interest within 6 months" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
      },
      required: ["probability", "strengths", "weaknesses", "improvements"],
    };

    const summary = JSON.stringify({
      name: org.name,
      mission: org.mission,
      description: org.short_description,
      sector: org.sector,
      country: org.country,
      sdgs: org.sdgs,
      stage: org.stage,
      funding_required: org.funding_required,
      readiness_score: org.readiness_score,
      verified: org.is_verified,
      aligned_funders_in_network: aligned,
    });

    const result = await callLovableAI(
      [
        {
          role: "system",
          content:
            "You are an experienced grants advisor. Estimate the probability (0-100) that an NGO will attract genuine funder interest within 6 months given its profile, readiness, and the alignment available in this platform's funder network. Be realistic.",
        },
        { role: "user", content: summary },
      ],
      schema,
    );

    await supa.from("organizations").update({ funding_probability: result.probability }).eq("id", organization_id);
    return Response.json(result, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
