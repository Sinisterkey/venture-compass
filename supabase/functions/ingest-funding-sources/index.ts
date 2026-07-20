/**
 * NGO Bridge — Funding Intelligence Engine: Ingestion
 *
 * Reads active data sources from the `data_sources` table, runs the matching connector
 * for each, normalizes opportunities to the canonical schema, upserts into
 * `funding_opportunities` (dedupe by URL), archives expired opportunities, and writes
 * a per-run log to `connector_logs`.
 */
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadFundingSourcesConfigFromEnv } from "./src/config.ts";
import type {
  ConnectorOpportunity,
  ConnectorContext,
  DataSourceRow,
  FundingConnector,
  FundingSourceConfig,
  FundingSourcesConfigFile,
  IngestionSummary,
  OpportunityUpsertRow,
  ProviderIngestionResult,
} from "./src/types.ts";
import {
  archiveExpiredOpportunities,
  getActiveDataSources,
  getSupabaseClient,
  normalizeOpportunity,
  updateDataSourceLastRun,
  upsertFundingOpportunity,
  writeConnectorLog,
} from "./src/db.ts";

import ReliefWebConnector from "./src/connectors/reliefweb.ts";
import UNDPConnector from "./src/connectors/undp.ts";
import DevexConnector from "./src/connectors/devex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function getNowIso() {
  return new Date().toISOString();
}

function getConnectorForSource(name: string): FundingConnector | null {
  if (name === "ReliefWeb") return ReliefWebConnector as any;
  if (name === "UNDP") return UNDPConnector as any;
  if (name === "Devex") return DevexConnector as any;
  return null;
}

function dataSourceRowToConfig(row: DataSourceRow): FundingSourceConfig {
  return {
    source_name: row.name,
    connector_type: (row.source_type as any) ?? "RSS",
    enabled: row.is_active,
    feed_url: row.source_url,
    api_endpoint: row.source_url,
    extraction_method: row.extraction_method ?? undefined,
    max_items: 50,
  };
}

function mergeConfigSources(
  dbSources: DataSourceRow[],
  fileConfig: FundingSourcesConfigFile | null,
): DataSourceRow[] {
  if (!fileConfig?.sources?.length) return dbSources;
  const fileNames = new Set(fileConfig.sources.map((s) => s.source_name.toLowerCase()));
  const merged = [...dbSources];
  for (const s of fileConfig.sources) {
    if (!s.enabled) continue;
    if (!fileNames.has(s.source_name.toLowerCase())) continue;
    const exists = merged.some((m) => m.name.toLowerCase() === s.source_name.toLowerCase());
    if (!exists) {
      merged.push({
        id: `env-${s.source_name}`,
        name: s.source_name,
        source_type: s.connector_type,
        source_url: s.feed_url ?? s.api_endpoint ?? "",
        extraction_method: s.parser_type ?? null,
        schedule_cron: s.crawl_interval ?? null,
        is_active: s.enabled,
        last_run_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
  return merged;
}

async function invokeConnector(
  supa: any,
  sourceRow: DataSourceRow,
  connector: FundingConnector,
  ctx: ConnectorContext,
): Promise<ProviderIngestionResult> {
  const startedAt = getNowIso();
  const started = Date.now();
  const config = dataSourceRowToConfig(sourceRow);

  const base: ProviderIngestionResult = {
    source: sourceRow.name,
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    duplicates_skipped: 0,
    archived: 0,
  };

  let status: "success" | "partial" | "failed" = "success";
  let errorMessage: string | null = null;

  try {
    const result = await connector.sync(config, ctx);

    if (result.shouldDisableSource) {
      console.warn(`[connector:disable] ${sourceRow.name} endpoint disabled for this run`);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let duplicates = 0;
    let scanned = 0;

    for (const opp of result.opportunities) {
      if (!opp?.title || !opp?.url) {
        skipped++;
        continue;
      }
      const url = String(opp.url).trim();
      if (!/^https?:\/\//i.test(url)) {
        skipped++;
        continue;
      }
      scanned++;

      const row: OpportunityUpsertRow = normalizeOpportunity(opp as ConnectorOpportunity);

      try {
        const action = await upsertFundingOpportunity(supa, row);
        if (action === "inserted") inserted++;
        else if (action === "updated") updated++;
        else duplicates++;
      } catch (e) {
        console.error(`[upsert] ${sourceRow.name} url=${url} error=${(e as Error).message}`);
        skipped++;
      }
    }

    if (result.error && scanned === 0) {
      status = "failed";
      errorMessage = result.error;
    } else if (result.error) {
      status = "partial";
      errorMessage = result.error;
    }

    const finishedAt = getNowIso();
    const durationMs = Date.now() - started;

    await writeConnectorLog(supa, {
      data_source_id: sourceRow.id,
      status,
      opportunities_found: scanned,
      opportunities_inserted: inserted,
      opportunities_updated: updated,
      duplicates_skipped: duplicates,
      error_message: errorMessage,
      duration_ms: durationMs,
      started_at: startedAt,
      finished_at: finishedAt,
    });

    await updateDataSourceLastRun(supa, sourceRow.id, startedAt);

    console.log(
      `[connector] ${sourceRow.name} ${status} inserted=${inserted} updated=${updated} duplicates=${duplicates} skipped=${skipped} durationMs=${durationMs}`,
    );

    return {
      ...base,
      scanned,
      inserted,
      updated,
      skipped,
      duplicates_skipped: duplicates,
      error: errorMessage ?? undefined,
    };
  } catch (e) {
    const durationMs = Date.now() - started;
    const msg = (e as Error).message;
    status = "failed";
    errorMessage = msg;

    const finishedAt = getNowIso();
    await writeConnectorLog(supa, {
      data_source_id: sourceRow.id,
      status,
      opportunities_found: 0,
      opportunities_inserted: 0,
      opportunities_updated: 0,
      duplicates_skipped: 0,
      error_message: msg,
      duration_ms: durationMs,
      started_at: startedAt,
      finished_at: finishedAt,
    });

    await updateDataSourceLastRun(supa, sourceRow.id, startedAt);

    console.error(`[connector] ${sourceRow.name} FAILED durationMs=${durationMs} error=${msg}`);

    return { ...base, error: msg };
  }
}

const serve = (globalThis as any)?.Deno?.serve;
if (!serve) throw new Error("Deno.serve is not available in this runtime");

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supa = getSupabaseClient();

    let fileConfig: FundingSourcesConfigFile | null = null;
    try {
      fileConfig = loadFundingSourcesConfigFromEnv();
    } catch {
      fileConfig = null;
    }

    let dbSources: DataSourceRow[] = [];
    try {
      dbSources = await getActiveDataSources(supa);
    } catch (e) {
      console.warn(`[data_sources] could not load from DB: ${(e as Error).message}`);
    }

    const sources = mergeConfigSources(dbSources, fileConfig);

    const ctx: ConnectorContext = {
      nowIso: getNowIso(),
      lastSyncIso: fileConfig?.last_synchronization_timestamp,
    };

    const totals: IngestionSummary = {
      ok: true,
      inserted: 0,
      updated: 0,
      providers: [],
    };

    if (!sources.length) {
      console.warn("[ingest] no active data sources found (DB or env)");
      return Response.json(totals, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    for (const sourceRow of sources) {
      const connector = getConnectorForSource(sourceRow.name);
      if (!connector) {
        console.warn(`[connector] no implementation for ${sourceRow.name}; skipping`);
        totals.providers.push({
          source: sourceRow.name,
          scanned: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          duplicates_skipped: 0,
          archived: 0,
          error: "No connector implementation for this source",
        });
        continue;
      }

      const res = await invokeConnector(supa, sourceRow, connector, ctx);
      totals.providers.push(res);
      totals.inserted += res.inserted;
      totals.updated += res.updated;
    }

    // Soft-archive expired opportunities after ingestion
    let archivedCount = 0;
    try {
      archivedCount = await archiveExpiredOpportunities(supa);
      console.log(`[archive] expired opportunities archived: ${archivedCount}`);
    } catch (e) {
      console.error(`[archive] failed: ${(e as Error).message}`);
    }

    return Response.json(
      { ...totals, archived: archivedCount },
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Critical ingest error:", (e as Error).message);
    return Response.json(
      {
        ok: false,
        inserted: 0,
        updated: 0,
        providers: [],
        error: `CRITICAL: ${(e as Error).message}`,
      },
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
