import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, callLovableAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { organization_id } = await req.json();
    if (!organization_id) throw new Error("organization_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not set in function secrets.");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in function secrets.");

    const supa = createClient(supabaseUrl, serviceRoleKey);

    let org: any = null;
    try {
      const orgResp = await supa.from("organizations").select("*").eq("id", organization_id).maybeSingle();
      org = orgResp.data;
    } catch (dbErr) {
      return Response.json(
        { error: "Failed to read organization from DB", details: (dbErr as Error).message },
        { status: 500, headers: corsHeaders },
      );
    }

    if (!org) throw new Error("Organization not found");

    let opps: any[] | null = null;
    try {
      const oppResp = await supa.from("funding_opportunities").select("*").eq("is_active", true);
      opps = oppResp.data as any[] | null;
    } catch (dbErr) {
      return Response.json(
        { error: "Failed to read funding_opportunities from DB", details: (dbErr as Error).message },
        { status: 500, headers: corsHeaders },
      );
    }

    const activeCount = opps?.length ?? 0;
    if (!activeCount) return Response.json({ matches: [], count: 0, debug: { active_opportunities: 0 } }, { headers: corsHeaders });

    const prescored = opps.map((o) => {
      let base = 30;
      const reasons: string[] = [];
      if (o.sectors?.length && org.sector && o.sectors.includes(org.sector)) { base += 20; reasons.push(`Sector match: ${org.sector}`); }
      if (o.countries?.length && org.country && o.countries.includes(org.country)) { base += 15; reasons.push(`Eligible country: ${org.country}`); }
      const sdgOverlap = (o.sdgs ?? []).filter((s: number) => (org.sdgs ?? []).includes(s));
      if (sdgOverlap.length) { base += Math.min(15, sdgOverlap.length * 5); reasons.push(`${sdgOverlap.length} shared SDG${sdgOverlap.length > 1 ? "s" : ""}`); }
      if (o.beneficiary_types?.length && org.beneficiary_type && o.beneficiary_types.includes(org.beneficiary_type)) { base += 10; reasons.push(`Serves ${org.beneficiary_type}`); }
      if (org.funding_required && o.min_amount && o.max_amount && org.funding_required >= o.min_amount && org.funding_required <= o.max_amount) {
        base += 10; reasons.push("Funding within grant range");
      }
      return { opp: o, base: Math.min(base, 95), reasons };
    }).sort((a, b) => b.base - a.base);

    const top = prescored.slice(0, 8);
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
              gaps: { type: "array", items: { type: "string" }, description: "What's missing or weak" },
            },
            required: ["opportunity_id", "score", "reasons", "gaps"],
          },
        },
      },
      required: ["results"],
    };

    const payload = JSON.stringify({
      organization: {
        name: org.name, mission: org.mission, sector: org.sector, country: org.country,
        sdgs: org.sdgs, beneficiary_type: org.beneficiary_type, stage: org.stage,
        funding_required: org.funding_required, description: org.short_description,
        readiness_score: org.readiness_score,
      },
      opportunities: top.map(({ opp }) => ({
        id: opp.id, funder: opp.funder, title: opp.title, summary: opp.summary,
        sectors: opp.sectors, sdgs: opp.sdgs, countries: opp.countries,
        beneficiary_types: opp.beneficiary_types,
        amount_range: [opp.min_amount, opp.max_amount, opp.currency],
        deadline: opp.deadline,
      })),
    });

    let aiResults: any[] = [];
    try {
      const ai = await callLovableAI([
        { role: "system", content: "You are a grants strategist. For each funding opportunity, decide the realistic 0-100 fit score for the NGO. Reasons must cite the specific alignment (sector, SDG, country, beneficiary, funding size, stage). Gaps must be concrete and actionable so the NGO knows what to strengthen before applying. Be honest — penalise misalignment." },
        { role: "user", content: payload },
      ], schema);
      aiResults = ai.results ?? [];
    } catch (_) {
      aiResults = top.map(({ opp, base, reasons }) => ({ opportunity_id: opp.id, score: base, reasons, gaps: [] }));
    }

    const rows = aiResults.map((r) => ({
      organization_id,
      opportunity_id: r.opportunity_id,
      owner_id: org.owner_id,
      score: r.score,
      reasons: r.reasons,
      gaps: r.gaps,
      computed_at: new Date().toISOString(),
    }));

    if (rows.length) {
      await supa.from("funding_matches").upsert(rows, { onConflict: "organization_id,opportunity_id" });
    }

    const topMatch = aiResults.sort((a, b) => b.score - a.score)[0];
    if (topMatch && topMatch.score >= 70) {
      const topOpp = top.find(t => t.opp.id === topMatch.opportunity_id)?.opp;
      if (topOpp) {
        await supa.from("notifications").insert({
          recipient_id: org.owner_id,
          type: "funding_match",
          title: `New funding match: ${topOpp.funder}`,
          body: `${topOpp.title} — ${topMatch.score}% fit for ${org.name}`,
          link: `/organizations/${org.id}`,
          organization_id: org.id,
        });
      }
    }

    return Response.json({ matches: aiResults, count: aiResults.length }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
