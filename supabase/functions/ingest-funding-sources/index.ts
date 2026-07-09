import { createClient } from "npm:@supabase/supabase-js@2";
import { XMLParser } from "npm:fast-xml-parser@4";
import { corsHeaders } from "../_shared/ai.ts";

// Ingest live funding opportunities from ReliefWeb's public RSS feed.
// The v2 JSON API now requires an approved `appname`; the RSS feed remains
// public and every item contains a direct deep link to the specific report.

const RSS_URL =
  "https://reliefweb.int/updates/rss.xml?search=" +
  encodeURIComponent('grant OR funding OR "call for proposals" OR appeal');

const AFRICA_COUNTRIES = new Set([
  "Zambia","Kenya","Nigeria","Uganda","Ghana","Rwanda","Malawi","Tanzania, United Republic of",
  "Ethiopia","Senegal","Zimbabwe","Democratic Republic of the Congo","South Africa","Mozambique",
  "Sudan","South Sudan","Somalia","Cameroon","Burkina Faso","Mali","Niger","Chad","Sierra Leone",
  "Liberia","Madagascar","Angola","Botswana","Namibia","Lesotho","Eswatini","Burundi",
  "Central African Republic","Republic of the Congo","Côte d'Ivoire","Togo","Benin","Guinea",
  "Guinea-Bissau","The Gambia","Mauritania","Djibouti","Eritrea","Comoros","Cabo Verde",
]);

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
const THEME_KEYS = new Set(Object.keys(THEME_TO_SECTOR));
const FORMAT_TAGS = new Set(["Appeal","News and Press Release","Analysis","Situation Report","Assessment"]);

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function isReliefWebReportUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("reliefweb.int") && /^\/(report|node)\/[^/]+/.test(u.pathname);
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const r = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NGOBridgeBot/1.0; +https://ngo-bridge.lovable.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!r.ok) throw new Error(`ReliefWeb RSS ${r.status}`);
    const xml = await r.text();
    console.log("rss status:", r.status, "bytes:", xml.length, "ct:", r.headers.get("content-type"), "preview:", xml.slice(0, 300));

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const doc = parser.parse(xml);
    const raw = doc?.rss?.channel?.item ?? [];
    const items: any[] = Array.isArray(raw) ? raw : [raw];
    console.log("rss items parsed:", items.length);

    let inserted = 0, updated = 0, skipped = 0;

    for (const it of items) {
      const title = String(it?.title ?? "").slice(0, 300).trim();
      const link = String(it?.link ?? "").trim();
      if (!title || !isReliefWebReportUrl(link)) { skipped++; continue; }

      const cats: string[] = ([] as any[]).concat(it?.category ?? []).map((c) => String(c).trim()).filter(Boolean);
      // Must be an actual funding-related format tag OR title contains funding wording
      const hasFundingFormat = cats.some((c) => FORMAT_TAGS.has(c));
      const titleMentionsFunding = /grant|funding|call for proposals?|appeal|award|financing/i.test(title);
      if (!hasFundingFormat && !titleMentionsFunding) { skipped++; continue; }

      const countries = cats.filter((c) => AFRICA_COUNTRIES.has(c));
      if (countries.length === 0) { skipped++; continue; }

      const themes = cats.filter((c) => THEME_KEYS.has(c));
      const sectors = Array.from(new Set(themes.map((t) => THEME_TO_SECTOR[t])));
      const summary = stripHtml(String(it?.description ?? "")).slice(0, 500);
      const funder = String(it?.author ?? it?.source ?? "ReliefWeb").slice(0, 200);

      const { data: existing } = await supa
        .from("funding_opportunities")
        .select("id")
        .eq("url", link)
        .maybeSingle();

      const row = {
        funder,
        title,
        summary: summary || null,
        url: link,
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
      { ok: true, source: "reliefweb-rss", inserted, updated, skipped, scanned: items.length },
      { headers: corsHeaders },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
