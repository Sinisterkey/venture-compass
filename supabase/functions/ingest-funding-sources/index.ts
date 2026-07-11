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

  // Keep IFRC working. Add other providers one-by-one.
  // Any provider failure must not prevent others from ingesting.
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const upsertByUrl = async (url: string, row: Record<string, unknown>) => {
      const { data: existing } = await supa
        .from("funding_opportunities")
        .select("id")
        .eq("url", url)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supa.from("funding_opportunities").update(row).eq("id", existing.id);
        if (error) throw error;
        return { action: "updated" as const, id: existing.id };
      }

      const { error } = await supa.from("funding_opportunities").insert(row);
      if (error) throw error;
      return { action: "inserted" as const };
    };

    let totals = {
      ok: true,
      providers: [] as Array<{
        source: string;
        scanned: number;
        inserted: number;
        updated: number;
        skipped: number;
        error?: string;
      }>,
    };

    // Provider 1: IFRC GO (disabled per request)

    // Provider 2: ReliefWeb

    // Goal: ingest only opportunities whose URL is a real deep posting page.
    // This placeholder is safe: it only trusts RSS item links and verifies they are reachable (200).
    {
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let scanned = 0;

      try {
        const RELIEFWEB_RSS =
          "https://reliefweb.int/rss/search?query=%22call%20for%20proposals%22%20OR%20%22appeal%22&limit=30";

        const r = await fetch(RELIEFWEB_RSS, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NGOBridgeBot/1.0)",
            "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5",
          },
        });
        if (!r.ok) throw new Error(`ReliefWeb RSS ${r.status}`);

        const xml = await r.text();
        const items = Array.from(
          xml.matchAll(
            /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g,
          ),
        );
        scanned = items.length;

        // Verify deep links to avoid storing 404 pages.
        const verify = async (url: string) => {
          try {
            const head = await fetch(url, {
              method: "GET",
              // keep it cheap; many origins support Range
              headers: { Range: "bytes=0-0" },
            });
            return head.ok;
          } catch {
            return false;
          }
        };

        for (const m of items) {
          const titleRaw = m[1] ?? "";
          const linkRaw = m[2] ?? "";
          const title = String(titleRaw).replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(linkRaw).replace(/<!\[CDATA\[|\]\]>/g, "").trim();

          if (!title || !url || !/^https?:\/\//i.test(url)) { skipped++; continue; }

          // Only accept ReliefWeb-looking detail URLs.
          // ReliefWeb typically uses /reports/..., /updates/..., /articles/... etc.
          if (!/reliefweb\.int\/(reports|updates|articles|news|jobs|organizations|projects|documents|sites)\//i.test(url)) {
            skipped++;
            continue;
          }

          // Ensure it exists (avoid 404 "wandered off" links).
          const ok = await verify(url);
          if (!ok) { skipped++; continue; }

          const row: Record<string, unknown> = {
            funder: "ReliefWeb",
            title,
            summary: null,
            url,
            sectors: [],
            countries: [],
            source: "reliefweb",
            is_verified: true,
            is_active: true,
            min_amount: null,
            max_amount: null,
            currency: "USD",
            deadline: null,
          };

          try {
            const res = await upsertByUrl(url, row);
            if (res.action === "inserted") inserted++; else updated++;
          } catch (err) {
            console.error("reliefweb upsert error:", (err as Error).message);
            skipped++;
          }
        }
      } catch (err) {
        totals.providers.push({
          source: "reliefweb",
          scanned,
          inserted,
          updated,
          skipped,
          error: (err as Error).message,
        });
      }

      totals.providers.push({
        source: "reliefweb",
        scanned,
        inserted,
        updated,
        skipped,
      });
    }

    return Response.json(totals, { headers: corsHeaders });
  } catch (e) {
    console.error("ingest error:", (e as Error).message);
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders });
  }
});
