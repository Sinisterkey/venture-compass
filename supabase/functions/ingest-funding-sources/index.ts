import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai.ts";

// Live funding-opportunity ingester.
//
// Source: IFRC GO public API (goadmin.ifrc.org). This endpoint is fully open,
// reachable from Deno Deploy egress, and every appeal returns a deep link to
// its dedicated page on go.ifrc.org, so "Open funding call" always lands on
// the exact appeal — never a funder homepage.

const IFRC_URL =
  "https://goadmin.ifrc.org/api/v2/appeal/" +
  "?region=0" +           // 0 = Africa
  "&limit=40" +
  "&ordering=-start_date";

const DTYPE_TO_SECTOR: Record<string, string> = {
  "Epidemic": "Health",
  "Complex Emergency": "Human Rights",
  "Population Movement": "Refugees & Migration",
  "Food Insecurity": "Agriculture",
  "Drought": "Climate",
  "Flood": "WASH",
  "Cyclone": "Climate",
  "Earthquake": "Social Services",
  "Fire": "Social Services",
  "Civil Unrest": "Human Rights",
  "Storm Surge": "Climate",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const r = await fetch(IFRC_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NGOBridgeBot/1.0)",
        "Accept": "application/json",
      },
    });
    if (!r.ok) throw new Error(`IFRC GO ${r.status}`);
    const payload = await r.json();
    const results: any[] = payload?.results ?? [];
    console.log("ifrc results:", results.length);

    let inserted = 0, updated = 0, skipped = 0;

    for (const a of results) {
      const id = a?.id;
      const name = String(a?.name ?? "").trim().slice(0, 300);
      const country = a?.country?.name ?? null;
      const dtype = a?.dtype?.name ?? null;
      const atype = a?.atype_display ?? null;
      const status = a?.status_display ?? null;
      const amount = Number(a?.amount_requested) || null;
      const funded = Number(a?.amount_funded) || null;
      const start = a?.start_date ?? null;
      const end = a?.end_date ?? null;
      const code = a?.code ?? null;

      if (!id || !name || !country) { skipped++; continue; }
      // Only surface active or recent appeals — closed ones aren't actionable.
      if (status && !/active|launched|open|pledged/i.test(status)) { skipped++; continue; }

      const url = `https://go.ifrc.org/appeals/${id}`;
      const funder = "IFRC (International Federation of Red Cross)";
      const sectorGuess = dtype && DTYPE_TO_SECTOR[dtype] ? [DTYPE_TO_SECTOR[dtype]] : [];

      const summaryBits = [
        `${atype ?? "Appeal"} appeal in ${country}`,
        dtype ? `Focus: ${dtype}` : null,
        amount ? `Requested CHF ${amount.toLocaleString()}` : null,
        funded ? `Funded CHF ${funded.toLocaleString()}` : null,
        start ? `Started ${new Date(start).toLocaleDateString()}` : null,
        code ? `Reference ${code}` : null,
      ].filter(Boolean);
      const summary = summaryBits.join(" · ").slice(0, 500);

      const row: Record<string, unknown> = {
        funder,
        title: name,
        summary,
        url,
        sectors: sectorGuess,
        countries: [country],
        source: "go.ifrc.org",
        is_verified: true,
        is_active: true,
        min_amount: amount,
        max_amount: amount,
        currency: amount ? "CHF" : null,
        deadline: end,
      };

      const { data: existing } = await supa
        .from("funding_opportunities")
        .select("id")
        .eq("url", url)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supa.from("funding_opportunities").update(row).eq("id", existing.id);
        if (error) { console.error("update error:", error.message); skipped++; }
        else updated++;
      } else {
        const { error } = await supa.from("funding_opportunities").insert(row);
        if (error) { console.error("insert error:", error.message); skipped++; }
        else inserted++;
      }
    }

    return Response.json(
      {
        ok: true,
        source: "ifrc-go",
        scanned: results.length,
        inserted,
        updated,
        skipped,
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error("ingest error:", (e as Error).message);
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
