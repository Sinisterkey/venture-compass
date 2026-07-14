/** 
 * NOTE: Supabase edge runtime uses Deno npm imports.
 * VSCode TS tooling sometimes can't resolve the `npm:` specifier types.
 * We keep it runtime-correct and suppress editor diagnostics.
 */
// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";

type SupabaseClient = any;

export function getSupabaseClient(): SupabaseClient {
  const deno = (globalThis as unknown as { Deno?: any }).Deno;
  const url = deno?.env?.get?.("SUPABASE_URL");
  const key = deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) throw new Error("SUPABASE_URL is not set in function secrets.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in function secrets.");
  return createClient(url, key);
}

export async function upsertFundingOpportunityByUrl(
  supa: SupabaseClient,
  oppUrl: string,
  row: Record<string, unknown>,
): Promise<"inserted" | "updated"> {
  const { data: existing } = await supa.from("funding_opportunities").select("id").eq("url", oppUrl).maybeSingle();

  if (existing?.id) {
    const { error } = await supa.from("funding_opportunities").update(row).eq("id", existing.id);
    if (error) throw error;
    return "updated";
  }

  const { error } = await supa.from("funding_opportunities").insert(row);
  if (error) throw error;
  return "inserted";
}
