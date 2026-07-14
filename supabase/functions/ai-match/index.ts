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

// Local-only NGO ↔ Funding opportunities matching (no live web search)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    const supaUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supaUrl) throw new Error("SUPABASE_URL is not set in function secrets.");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in function secrets.");

    const supa = createClient(supaUrl, serviceRoleKey);

    const { data: org } = await supa.from("organizations").select("*").eq("id", organization_id).maybeSingle();
    if (!org) throw new Error("Organization not found");

    const { data: opps } = await supa.from("funding_opportunities").select("*").eq("is_active", true);
    const activeCount = opps?.length ?? 0;

    if (!activeCount) {
      return Response.json({ matches: [], count: 0, debug: { active_opportunities: 0 } }, { headers: corsHeaders });
    }

    const prescored = (opps ?? [])
      .map((o: any) => {
        let base = 25;
        const reasons: string[] = [];
        const gaps: string[] = [];

        if (o.sectors?.length && org.sector && o.sectors.includes(org.sector)) {
          base += 20;
          reasons.push(`Sector match: ${org.sector}`);
        } else if (org.sector) {
          gaps.push(`Sector not listed in opportunity (${org.sector})`);
        }

        if (o.countries?.length && org.country && o.countries.includes(org.country)) {
          base += 15;
          reasons.push(`Eligible country: ${org.country}`);
        } else if (org.country) {
          gaps.push(`Opportunity country eligibility does not include ${org.country}`);
        }

        const sdgOverlap = (o.sdgs ?? []).filter((s: number) => (org.sdgs ?? []).includes(s));
        if (sdgOverlap.length) {
          base += Math.min(18, sdgOverlap.length * 6);
          reasons.push(`${sdgOverlap.length} shared SDG${sdgOverlap.length > 1 ? "s" : ""}`);
        } else {
          gaps.push("No overlapping SDGs found");
        }

        if (o.beneficiary_types?.length && org.beneficiary_type && o.beneficiary_types.includes(org.beneficiary_type)) {
          base += 10;
          reasons.push(`Serves beneficiary type: ${org.beneficiary_type}`);
        } else if (org.beneficiary_type) {
          gaps.push(`Beneficiary type not in opportunity list (${org.beneficiary_type})`);
        }

        if (org.funding_required && o.min_amount && o.max_amount) {
          const reqAmt = Number(org.funding_required);
          const minAmt = Number(o.min_amount);
          const maxAmt = Number(o.max_amount);
          if (!Number.isNaN(reqAmt) && reqAmt >= minAmt && reqAmt <= maxAmt) {
            base += 10;
            reasons.push("Funding within grant range");
          } else {
            gaps.push("Requested funding may fall outside opportunity range");
          }
        }

        return { opp: o, base: Math.min(base, 95), reasons, gaps };
      })
      .sort((a: any, b: any) => b.base - a.base);

    const top = prescored.slice(0, 10);

    const schema = {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              opportunity_id: { type: "string" },
              score: { type: "integer", description: "0-100 fit score" },
              reasons: { type: "array", items: { type: "string" } },
              gaps: { type: "array", items: { type: "string" } },
            },
            required: ["opportunity_id", "score", "reasons", "gaps"],
          },
        },
      },
      required: ["results"],
    };

    const payload = JSON.stringify({
      organization: {
        name: org.name,
        mission: org.mission,
        sector: org.sector,
        country: org.country,
        sdgs: org.sdgs,
        beneficiary_type: org.beneficiary_type,
        stage: org.stage,
        funding_required: org.funding_required,
        description: org.short_description,
        readiness_score: org.readiness_score,
      },
      opportunities: top.map(({ opp }: any) => ({
        id: opp.id,
        funder: opp.funder,
        title: opp.title,
        summary: opp.summary,
        sectors: opp.sectors,
        sdgs: opp.sdgs,
        countries: opp.countries,
        beneficiary_types: opp.beneficiary_types,
        amount_range: [opp.min_amount, opp.max_amount, opp.currency],
        deadline: opp.deadline,
      })),
    });

    let aiResults: any[] = [];
    try {
      const ai = await callLovableAI(
        [
          {
            role: "system",
            content:
              "You are a grants strategist. For each funding opportunity, decide the realistic 0-100 fit score for the NGO. Reasons must cite specific alignment (sector, SDG, country, beneficiary type, funding size, stage). Gaps must be concrete and actionable.",
          },
          { role: "user", content: payload },
        ],
        schema,
      );

      aiResults = ai.results ?? [];
    } catch {
      aiResults = top.map(({ opp, base, reasons, gaps }: any) => ({
        opportunity_id: opp.id,
        score: base,
        reasons,
        gaps: gaps ?? [],
      }));
    }

    const rows = aiResults.map((r: any) => ({
      organization_id,
      opportunity_id: r.opportunity_id,
      owner_id: org.owner_id,
      score: r.score,
      reasons: r.reasons ?? [],
      gaps: r.gaps ?? [],
      computed_at: new Date().toISOString(),
    }));

    if (rows.length) {
      await supa.from("funding_matches").upsert(rows, { onConflict: "organization_id,opportunity_id" });
    }

    return Response.json(
      { matches: aiResults, count: aiResults.length, debug: { active_opportunities: activeCount } },
      { headers: corsHeaders },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
