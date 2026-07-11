import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai.ts";

  // Provider 1: IFRC GO (disabled)

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

    // Provider 3: UNDP Procurement Notices
    {
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let scanned = 0;

      try {
        // This is a representative URL. UNDP offers various RSS feeds for procurement.
        const UNDP_RSS = "https://procurement-notices.undp.org/rss.cfm";

        const r = await fetch(UNDP_RSS, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LaunchPadAfricaBot/1.0)",
            "Accept": "application/rss+xml,text/xml;q=0.9,application/xml;q=0.8,*/*;q=0.5",
          },
        });
        if (!r.ok) throw new Error(`UNDP RSS ${r.status}`);

        const xml = await r.text();
        const items = Array.from(
          xml.matchAll(
            /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>/g,
          ),
        );
        scanned = items.length;

        for (const m of items) {
          const titleRaw = m[1] ?? "";
          const linkRaw = m[2] ?? "";
          const dateRaw = m[3] ?? "";
          const title = String(titleRaw).replace(/<!\[CDATA\[|\]\]>/g, "").trim().slice(0, 300);
          const url = String(linkRaw).replace(/<!\[CDATA\[|\]\]>/g, "").trim();
          const deadline = dateRaw ? new Date(dateRaw).toISOString() : null;


          if (!title || !url || !/^https?:\/\//i.test(url)) {
            skipped++;
            continue;
          }

          // Filter for notices that are likely to be for NGOs/CSOs
          if (!/call for proposal|grant|cso|ngo/i.test(title)) {
            skipped++;
            continue;
          }

          const row: Record<string, unknown> = {
            funder: "UNDP",
            title,
            summary: null, // RSS feed may not have a clean summary field
            url,
            sectors: [], // Could be parsed from title/description in a more advanced version
            countries: [], // Could also be parsed
            source: "undp",
            is_verified: true,
            is_active: true,
            min_amount: null,
            max_amount: null,
            currency: "USD",
            deadline,
          };

          try {
            const res = await upsertByUrl(url, row);
            if (res.action === "inserted") inserted++; else updated++;
          } catch (err) {
            console.error("undp upsert error:", (err as Error).message);
            skipped++;
          }
        }
      } catch (err) {
        totals.providers.push({
          source: "undp",
          scanned,
          inserted,
          updated,
          skipped,
          error: (err as Error).message,
        });
      }

      totals.providers.push({
        source: "undp",
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