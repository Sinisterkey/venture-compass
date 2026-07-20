// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";
import type { ConnectorOpportunity, DataSourceRow, OpportunityUpsertRow } from "./types.ts";

type SupabaseClient = any;

export function getSupabaseClient(): SupabaseClient {
  const deno = (globalThis as unknown as { Deno?: any }).Deno;
  const url = deno?.env?.get?.("SUPABASE_URL");
  const key = deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) throw new Error("SUPABASE_URL is not set in function secrets.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in function secrets.");
  return createClient(url, key);
}

export async function getActiveDataSources(supa: SupabaseClient): Promise<DataSourceRow[]> {
  const { data, error } = await supa
    .from("data_sources")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as DataSourceRow[];
}

export async function updateDataSourceLastRun(
  supa: SupabaseClient,
  sourceId: string,
  startedAt: string,
): Promise<void> {
  const { error } = await supa
    .from("data_sources")
    .update({ last_run_at: startedAt, updated_at: new Date().toISOString() })
    .eq("id", sourceId);
  if (error) console.error(`[data_sources] failed to update last_run_at: ${error.message}`);
}

export async function writeConnectorLog(
  supa: SupabaseClient,
  entry: {
    data_source_id: string;
    status: "success" | "partial" | "failed";
    opportunities_found: number;
    opportunities_inserted: number;
    opportunities_updated: number;
    duplicates_skipped: number;
    error_message?: string | null;
    duration_ms: number;
    started_at: string;
    finished_at: string;
  },
): Promise<void> {
  const { error } = await supa.from("connector_logs").insert({
    data_source_id: entry.data_source_id,
    status: entry.status,
    opportunities_found: entry.opportunities_found,
    opportunities_inserted: entry.opportunities_inserted,
    opportunities_updated: entry.opportunities_updated,
    duplicates_skipped: entry.duplicates_skipped,
    error_message: entry.error_message ?? null,
    duration_ms: entry.duration_ms,
    started_at: entry.started_at,
    finished_at: entry.finished_at,
  });
  if (error) console.error(`[connector_logs] insert failed: ${error.message}`);
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function truncate(s: unknown, max: number): string | null {
  if (s == null) return null;
  const str = String(s).trim();
  if (!str) return null;
  return str.length > max ? str.slice(0, max) : str;
}

function toIsoDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const ms = Date.parse(d);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

function toIsoTimestamp(d: string | null | undefined): string | null {
  if (!d) return null;
  const ms = Date.parse(d);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function normalizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
    .filter((v) => v.length > 0);
}

function normalizeSdgs(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => {
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      return Number.isFinite(n) && n >= 1 && n <= 17 ? n : null;
    })
    .filter((n): n is number => n !== null);
}

export function normalizeOpportunity(opp: ConnectorOpportunity): OpportunityUpsertRow {
  const url = String(opp.url).trim();
  return {
    funder: truncate(opp.funder, 200) ?? "Unknown",
    title: truncate(opp.title, 300) ?? "Untitled",
    summary: truncate(opp.summary, 5000),
    url,
    source: truncate(opp.source, 100),
    source_name: truncate(opp.source_name ?? opp.source, 100),
    source_url: truncate(opp.source_url ?? opp.url, 1000),
    application_url: truncate(opp.application_url ?? opp.url, 1000),
    sectors: normalizeArray(opp.sectors),
    countries: normalizeArray(opp.countries),
    regions: normalizeArray(opp.regions),
    focus_areas: normalizeArray(opp.focus_areas),
    keywords: normalizeArray(opp.keywords),
    sdgs: normalizeSdgs(opp.sdgs),
    beneficiary_types: normalizeArray(opp.beneficiary_types),
    eligible_organizations: truncate(opp.eligible_organizations, 1000),
    min_amount: opp.min_amount ?? null,
    max_amount: opp.max_amount ?? null,
    currency: truncate(opp.currency, 10) ?? "USD",
    deadline: toIsoDate(opp.deadline),
    published_date: toIsoDate(opp.published_date),
    is_verified: opp.is_verified ?? true,
    is_active: opp.is_active ?? true,
    status: "active",
  };
}

export type UpsertResult = "inserted" | "updated" | "duplicate";

export async function upsertFundingOpportunity(
  supa: SupabaseClient,
  row: OpportunityUpsertRow,
): Promise<UpsertResult> {
  const canonicalUrl = normalizeUrl(String(row.url));

  const { data: existing } = await supa
    .from("funding_opportunities")
    .select("id, url, title, summary, deadline")
    .or(`url.eq.${canonicalUrl},url.eq.${String(row.url).trim()}`)
    .maybeSingle();

  if (existing?.id) {
    const isDuplicate =
      existing.title === row.title &&
      (existing.summary ?? null) === (row.summary ?? null) &&
      (existing.deadline ?? null) === (row.deadline ?? null);

    if (isDuplicate) {
      return "duplicate";
    }

    const { error } = await supa
      .from("funding_opportunities")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return "updated";
  }

  const { error } = await supa.from("funding_opportunities").insert(row);
  if (error) throw error;
  return "inserted";
}

export async function archiveExpiredOpportunities(supa: SupabaseClient): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supa
    .from("funding_opportunities")
    .update({
      status: "archived",
      is_active: false,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("status", "active")
    .lt("deadline", today)
    .not("deadline", "is", null)
    .select("id");
  if (error) {
    console.error(`[archive] failed: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}
