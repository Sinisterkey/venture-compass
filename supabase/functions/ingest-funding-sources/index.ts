import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai.ts";

// Ingest live funding opportunities from free public sources:
//  - ReliefWeb (UN OCHA) reports tagged as appeals / funding / grants
// Only rows with a real deep link to the specific report are kept — no funder homepages.

const RW_URL = "https://api.reliefweb.int/v1/reports";

async function fetchReliefWeb(): Promise<any[]> {
  const body = {
    appname: "ngo-bridge",
    limit: 40,
    profile: "list",
    preset: "latest",
    query: { value: "grant OR funding OR \"call for proposals\" OR appeal", operator: "OR", fields: ["title", "body"] },
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

// Only accept ReliefWeb deep report links, never the root domain or an attachment.
function pickReportUrl(f: any, id: string | number | undefined): string | null {
  const candidates: string[] = [f?.url_alias, f?.url].filter(Boolean);
  for (const c of candidates) {
    try {
      const u = new URL(c);
      if (u.hostname.endsWith("reliefweb.int") && /^\/(report|node)\/[^/]+/.test(u.pathname)) {
        return u.toString();
      }
    } catch { /* skip */ }
  }
  // Fallback: build canonical report URL from the numeric id if available.
  if (id != null) return `https://reliefweb.int/node/${id}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const items = await fetchReliefWeb();
    let inserted = 0, updated = 0, skipped = 0;

    for (const item of items) {
      const f = item.fields ?? {};
      const funder = (f.source?.[0]?.name ?? "ReliefWeb").slice(0, 200);
      const title = (f.title ?? "").slice(0, 300);
      if (!title) { skipped++; continue; }

      const bodyText = (f.body ?? "").replace(/\s+/g, " ").trim();
      if (!/grant|funding|call for proposals?|appeal|award|financing/i.test(bodyText + " " + title)) {
        skipped++; continue;
      }

      const url = pickReportUrl(f, item.id);
      if (!url) { skipped++; continue; }

      const summary = bodyText.slice(0, 500);
      const countries = (f.primary_country ?? []).map((c: any) => c.name).filter(Boolean);
      const themes = (f.theme ?? []).map((t: any) => t.name);
      const sectors = Array.from(new Set(themes.map((t: string) => THEME_TO_SECTOR[t]).filter(Boolean)));

      // Dedupe by url
      const { data: existing } = await supa
        .from("funding_opportunities")
        .select("id")
        .eq("url", url)
        .maybeSingle();

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

    return Response.json(
      { ok: true, source: "reliefweb", inserted, updated, skipped, scanned: items.length },
      { headers: corsHeaders },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
