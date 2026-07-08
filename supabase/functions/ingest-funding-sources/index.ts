import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai.ts";

// Ingest live funding opportunities from free public sources:
//  - ReliefWeb (UN OCHA) reports tagged as appeals / funding / grants
// EU F&T portal and Gates Grand Challenges are HTML-only for open lists — those
// remain in the curated seed until a Firecrawl connector is added.

const RW_URL = "https://api.reliefweb.int/v1/reports";

async function fetchReliefWeb(): Promise<any[]> {
  const body = {
    appname: "ngo-bridge",
    limit: 30,
    profile: "list",
    preset: "latest",
    query: { value: "grant OR funding OR call for proposals OR appeal", operator: "OR", fields: ["title", "body"] },
    filter: {
      operator: "AND",
      conditions: [
        { field: "format.name", value: ["Appeal", "News and Press Release"], operator: "OR" },
        { field: "primary_country.iso3", value: ["ZMB","KEN","NGA","UGA","GHA","RWA","MWI","TZA","ETH","SEN","ZWE","COD"], operator: "OR" },
      ],
    },
    fields: { include: ["title", "body", "source", "url", "url_alias", "primary_country", "theme", "date"] },
  };
  const r = await fetch(RW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`ReliefWeb ${r.status}`);
  const j = await r.json();
  return j?.data ?? [];
}

const THEME_TO_SECTOR: Record<string, string> = {
  "Agriculture": "Agriculture",
  "Education": "Education",
  "Food and Nutrition": "Agriculture",
  "Gender": "Gender",
  "Health": "Health",
  "Water Sanitation Hygiene": "WASH",
  "Climate Change and Environment": "Climate",
  "Protection and Human Rights": "Human Rights",
  "Shelter and Non-Food Items": "Social Services",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const items = await fetchReliefWeb();
    let inserted = 0, updated = 0;

    for (const item of items) {
      const f = item.fields ?? {};
      const funder = f.source?.[0]?.name ?? "ReliefWeb";
      const title = (f.title ?? "").slice(0, 300);
      if (!title) continue;

      const bodyText = (f.body ?? "").replace(/\s+/g, " ").trim();
      // Only keep items that actually mention funding-like keywords in the body
      if (!/grant|funding|call for proposals?|appeal|award|financing/i.test(bodyText + " " + title)) continue;

      const summary = bodyText.slice(0, 500);
      // Prefer the direct public report page URL; ReliefWeb exposes it as `url_alias`.
      // `f.url` sometimes points to an external attachment/PDF, and `item.href` is the API URL — avoid both as fallbacks.
      const url = f.url_alias ?? f.url ?? null;
      const countries = (f.primary_country ?? []).map((c: any) => c.name).filter(Boolean);
      const themes = (f.theme ?? []).map((t: any) => t.name);
      const sectors = Array.from(new Set(themes.map((t: string) => THEME_TO_SECTOR[t]).filter(Boolean)));

      // Dedupe by url when present, else by funder+title
      const existingQ = supa.from("funding_opportunities").select("id");
      const { data: existing } = url
        ? await existingQ.eq("url", url).maybeSingle()
        : await existingQ.eq("funder", funder).eq("title", title).maybeSingle();

      const row = {
        funder,
        title,
        summary,
        url,
        sectors,
        countries,
        source: "reliefweb.int",
        is_verified: true,
        is_active: true,
      };

      if (existing?.id) {
        await supa.from("funding_opportunities").update(row).eq("id", existing.id);
        updated++;
      } else {
        await supa.from("funding_opportunities").insert(row);
        inserted++;
      }
    }

    return Response.json({ ok: true, source: "reliefweb", inserted, updated, scanned: items.length }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
