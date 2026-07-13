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
      inserted: 0,
      updated: 0,
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
      totals.inserted += inserted;
      totals.updated += updated;
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
      totals.inserted += inserted;
      totals.updated += updated;
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
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "devex", scanned, inserted, updated, skipped });
    }

    // Provider 4: Global Affairs Canada (procurement) - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.canada.ca/en/global-affairs/news.html/rss";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`GAC RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/call for|tender|grant|proposal/i.test(title)) { skipped++; continue; }
          const row = { funder: "Global Affairs Canada", title, url, source: "gac", is_verified: true, is_active: true, currency: "CAD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "gac", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "gac", scanned, inserted, updated, skipped });
    }

    // Provider 5: USAID (news/procurement) - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.usaid.gov/rss";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`USAID RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/solicitation|grant|proposal|cso|ngo|request for/i.test(title)) { skipped++; continue; }
          const row = { funder: "USAID", title, url, source: "usaid", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "usaid", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "usaid", scanned, inserted, updated, skipped });
    }

    // Provider 6: UK FCDO - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.gov.uk/government/news.atom";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/atom+xml,text/xml;q=0.9,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`FCDO RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link[^>]*href="([\s\S]*?)"/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal|tender/i.test(title)) { skipped++; continue; }
          const row = { funder: "FCDO", title, url, source: "fcd0", is_verified: true, is_active: true, currency: "GBP" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "fcd0", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "fcd0", scanned, inserted, updated, skipped });
    }

    // Provider 7: OECD Development Aid - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.oecd.org/newsroom/rss.xml";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`OECD RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal/i.test(title)) { skipped++; continue; }
          const row = { funder: "OECD", title, url, source: "oecd", is_verified: true, is_active: true, currency: "EUR" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "oecd", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "oecd", scanned, inserted, updated, skipped });
    }

    // Provider 8: Shell Foundation - RSS (news)
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.shellfoundation.org/feeds/news/";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Shell Foundation RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal/i.test(title)) { skipped++; continue; }
          const row = { funder: "Shell Foundation", title, url, source: "shell-foundation", is_verified: true, is_active: true, currency: "GBP" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "shell-foundation", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "shell-foundation", scanned, inserted, updated, skipped });
    }

    // Provider 9: Mastercard Foundation - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://mastercardfdn.org/feed/";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Mastercard Foundation RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal|request for/i.test(title)) { skipped++; continue; }
          const row = { funder: "Mastercard Foundation", title, url, source: "mastercard-foundation", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "mastercard-foundation", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "mastercard-foundation", scanned, inserted, updated, skipped });
    }

    // Provider 10: Bill & Melinda Gates Foundation - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.gatesfoundation.org/feed";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Gates Foundation RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal|request for/i.test(title)) { skipped++; continue; }
          const row = { funder: "Bill & Melinda Gates Foundation", title, url, source: "gates-foundation", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "gates-foundation", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "gates-foundation", scanned, inserted, updated, skipped });
    }

    // Provider 11: Wellcome Trust - RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://wellcome.org/news/rss";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Wellcome RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal/i.test(title)) { skipped++; continue; }
          const row = { funder: "Wellcome Trust", title, url, source: "wellcome-trust", is_verified: true, is_active: true, currency: "GBP" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "wellcome-trust", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "wellcome-trust", scanned, inserted, updated, skipped });
    }

    // Provider 12: CharityVillage (grants) RSS
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.charityvillage.com/rss/grants.xml";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`CharityVillage RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/grant|funding|call for|proposal/i.test(title)) { skipped++; continue; }
          const row = { funder: "CharityVillage", title, url, source: "charityvillage", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "charityvillage", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "charityvillage", scanned, inserted, updated, skipped });
    }

    // Provider 13: Grants.gov RSS (US federal opportunities)
    {
      let inserted = 0, updated = 0, skipped = 0, scanned = 0;
      try {
        const RSS = "https://www.grants.gov/rss/portal/rss.xml";
        const r = await fetch(RSS, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)", "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5" } });
        if (!r.ok) throw new Error(`Grants.gov RSS ${r.status}`);
        const xml = await r.text();
        const items = Array.from(xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g));
        scanned = items.length;

        for (const m of items) {
          const title = String(m[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(m[2] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          if (!title || !url || !/^https?:\/\//i.test(url) || !/funding|grant|opportunity|proposal|cso/i.test(title)) { skipped++; continue; }
          const row = { funder: "Grants.gov", title, url, source: "grants-gov", is_verified: true, is_active: true, currency: "USD" };
          const res = await upsertByUrl(url, row);
          if (res.action === "inserted") inserted++; else updated++;
        }
      } catch (err) {
        totals.providers.push({ source: "grants-gov", scanned, inserted, updated, skipped, error: (err as Error).message });
      }
      totals.inserted += inserted;
      totals.updated += updated;
      totals.providers.push({ source: "grants-gov", scanned, inserted, updated, skipped });
    }

    return Response.json(totals, { headers: corsHeaders });
  } catch (e) {
    console.error("Critical ingest error:", (e as Error).message);
    return Response.json({ error: `CRITICAL: ${(e as Error).message}` }, { status: 500, headers: corsHeaders });
  }
});
