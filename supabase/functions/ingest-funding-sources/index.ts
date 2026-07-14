/** 
 * NOTE: Supabase edge runtime uses Deno npm imports.
 * Editor tooling may not understand `npm:` specifiers or Deno globals.
 */
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadFundingSourcesConfigFromEnv } from "./src/config";
import type { FundingConnector, FundingSourceConfig, FundingSourcesConfigFile } from "./src/types";
import { getSupabaseClient, upsertFundingOpportunityByUrl } from "./src/db";

import ReliefWebConnector from "./src/connectors/reliefweb";
import UNDPConnector from "./src/connectors/undp";
import DevexConnector from "./src/connectors/devex";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getNowIso() {
  return new Date().toISOString();
}

function safeUpper(s: unknown): string {
  return typeof s === "string" ? s.toUpperCase() : "";
}

function hasEnabledConnector(config: FundingSourcesConfigFile | null): boolean {
  return !!config?.sources?.some((s) => s.enabled);
}

async function invokeConnector(
  supa: any,
  config: FundingSourceConfig,
  connector: FundingConnector,
  ctx: { nowIso: string; lastSyncIso?: string },
) {
  const started = Date.now();

  const baseSummary = {
    source: config.source_name,
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    error: undefined as string | undefined,
  };

  try {
    const result = await connector.sync(config, ctx);

    if (result.shouldDisableSource) {
      // We can't persist disable into DB yet (config-file loader only),
      // but we can reflect it in logs.
      console.warn(`[connector:disable] ${config.source_name} endpoint/config disabled for this run`);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let scanned = 0;

    for (const opp of result.opportunities) {
      if (!opp?.title || !opp?.url) {
        skipped++;
        continue;
      }
      scanned++;

      const url = String(opp.url).trim();
      if (!/^https?:\/\//i.test(url)) {
        skipped++;
        continue;
      }

      // Map connector output to funding_opportunities columns.
      const row: Record<string, unknown> = {
        funder: opp.funder,
        title: String(opp.title).slice(0, 300),
        summary: opp.summary,
        url,
        source: opp.source,
        sectors: opp.sectors ?? [],
        countries: opp.countries ?? [],
        sdgs: opp.sdgs ?? [],
        beneficiary_types: opp.beneficiary_types ?? [],
        min_amount: opp.min_amount ?? null,
        max_amount: opp.max_amount ?? null,
        currency: opp.currency ?? "USD",
        deadline: opp.deadline ? new Date(opp.deadline).toISOString().slice(0, 10) : null,
        is_verified: opp.is_verified ?? true,
        is_active: opp.is_active ?? true,
      };

      const action = await upsertFundingOpportunityByUrl(supa, url, row);
      if (action === "inserted") inserted++;
      else updated++;
    }

    const durationMs = Date.now() - started;
    console.log(
      `[connector] ${config.source_name} ok inserted=${inserted} updated=${updated} scanned=${scanned} skipped=${skipped} durationMs=${durationMs}`,
    );

    return {
      ...baseSummary,
      inserted,
      updated,
      scanned,
      skipped,
      error: undefined,
      ok: true,
    };
  } catch (e) {
    const durationMs = Date.now() - started;
    const msg = (e as Error).message;

    console.error(
      `[connector] ${config.source_name} FAILED durationMs=${durationMs} error=${msg}`,
    );

    return {
      ...baseSummary,
      error: msg,
      ok: false,
    };
  }
}

function getConnectorForSource(config: FundingSourceConfig): FundingConnector | null {
  // Connectors implemented below are intentionally limited to ReliefWeb/UNDP/Devex for now.
  // Templates/stubs for the wider list will be added next without hardcoding endpoints.
  if (config.source_name === "ReliefWeb") return ReliefWebConnector as any;
  if (config.source_name === "UNDP") return UNDPConnector as any;
  if (config.source_name === "Devex") return DevexConnector as any;

  return null;
}

const serve = (globalThis as any)?.Deno?.serve;
if (!serve) throw new Error("Deno.serve is not available in this runtime");

serve(async (req: any) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supa = getSupabaseClient();

    const config = loadFundingSourcesConfigFromEnv();
    const ctx = {
      nowIso: getNowIso(),
      lastSyncIso: config.last_synchronization_timestamp,
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
      opportunities: [] as any[],
    };

    const enabled = config.sources.filter((s) => s.enabled);
    if (!enabled.length) {
      totals.ok = true;
      return Response.json(totals, { headers: corsHeaders });
    }

    for (const sourceConfig of enabled) {
      const connector = getConnectorForSource(sourceConfig);
      if (!connector) {
        console.warn(`[connector] no implementation for source_name=${sourceConfig.source_name}; skipping`);
        totals.providers.push({
          source: sourceConfig.source_name,
          scanned: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          error: "No connector implementation for this source_name",
        });
        continue;
      }

      const res = await invokeConnector(supa, sourceConfig, connector, ctx);
      totals.providers.push({
        source: sourceConfig.source_name,
        scanned: res.scanned,
        inserted: res.inserted,
        updated: res.updated,
        skipped: res.skipped,
        error: res.error,
      });

      totals.inserted += res.inserted;
      totals.updated += res.updated;
    }

    // We don't return all raw connector opportunities yet; only ensure response schema compliance.
    totals.opportunities = [];

    return Response.json(totals, { headers: corsHeaders });
  } catch (e) {
    console.error("Critical ingest error:", (e as Error).message);
    return Response.json(
      {
        ok: false,
        inserted: 0,
        updated: 0,
        providers: [],
        opportunities: [],
        error: `CRITICAL: ${(e as Error).message}`,
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
