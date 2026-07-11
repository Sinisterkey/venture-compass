import { createClient } from "npm:@supabase/supabase-js@2";

// Shared CORS for all AI edge functions
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url) throw new Error("SUPABASE_URL is not set in function secrets.");
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in function secrets.");

    const supa = createClient(url, key);

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

    const totals = {
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

    // Provider 1: ReliefWeb
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RELIEFWEB_RSS = "https://reliefweb.int/rss/search?query=%22call%20for%20proposals%22%20OR%20%22appeal%22&limit=30";
        const r = await fetch(RELIEFWEB_RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; NGOBridgeBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`ReliefWeb RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/reliefweb\.int\/(reports|updates|articles|news|jobs|organizations|projects|documents|sites)\//i.test(url)) {
            skipped++;
            continue;
          }
          const row = { funder: "ReliefWeb", title, url, source: "reliefweb", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "reliefweb", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.providers.push({ source: "reliefweb", scanned, inserted, updated, skipped });
    }

    // Provider 2: UNDP Procurement Notices
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const UNDP_RSS = "https://procurement-notices.undp.org/rss.cfm";
        const r = await fetch(UNDP_RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`UNDP RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          const deadline = m[3] ? new Date(m[3]).toISOString() : null;
          if (!title || !url || !/^https?:\/\//i.test(url) || !/call for proposal|grant|cso|ngo/i.test(title)) {
            skipped++;
            continue;
          }
          const row = { funder: "UNDP", title, url, deadline, source: "undp", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "undp", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.providers.push({ source: "undp", scanned, inserted, updated, skipped });
    }

    // Provider 3: Devex
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const DEVEX_RSS = "https://www.devex.com/funding/investments.rss";
        const r = await fetch(DEVEX_RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; VentureCompassBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Devex RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/www\.devex\.com\/news\//i.test(url)) {
            skipped++;
            continue;
          }
          const row = { funder: "Devex", title, url, source: "devex", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "devex", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.providers.push({ source: "devex", scanned, inserted, updated, skipped });
    }

    return Response.json(totals, { headers: corsHeaders });
  } catch (e) {
    console.error("Critical ingest error:", (e as Error).message);
    return Response.json({ error: `CRITICAL: ${(e as Error).message}` }, { status: 500, headers: corsHeaders });
  }
});