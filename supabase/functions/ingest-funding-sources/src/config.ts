export type ConnectorType = "API" | "RSS" | "Atom" | "HTML" | "PDF";

export type FundingSourceConfig = {
  source_name: string;
  connector_type: ConnectorType;
  enabled: boolean;

  // Configurable endpoints (may be empty until verified)
  base_url?: string;
  feed_url?: string;
  api_endpoint?: string;

  requires_api_key?: boolean;
  crawl_interval?: string;

  parser_type?: string;

  // Connector-specific knobs (optional)
  // For RSS/Atom:
  max_items?: number;
  // For HTML/PDF:
  // placeholder for later
};

export type FundingSourcesConfigFile = {
  last_synchronization_timestamp?: string; // ISO string
  sources: FundingSourceConfig[];
};

function assertRecord(x: unknown): asserts x is Record<string, unknown> {
  if (!x || typeof x !== "object") throw new Error("Invalid JSON config: expected object");
}

function safeParseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`Invalid JSON in FUNDING_SOURCES_CONFIG_JSON: ${(e as Error).message}`);
  }
}

function getEnv(name: string): string | undefined {
  // Avoid direct `Deno` reference so TS/IDE doesn't complain in non-Deno TS configs.
  const deno = (globalThis as unknown as { Deno?: any }).Deno;
  return deno?.env?.get?.(name);
}

/**
 * Loader reads configuration from a central JSON provided via environment variable.
 * This avoids hardcoding URLs in code while remaining runtime-safe for Supabase Edge.
 */
export function loadFundingSourcesConfigFromEnv(): FundingSourcesConfigFile {
  const raw = getEnv("FUNDING_SOURCES_CONFIG_JSON");
  if (!raw) {
    throw new Error(
      "Missing FUNDING_SOURCES_CONFIG_JSON env var. Provide a JSON payload with shape: { last_synchronization_timestamp?: string, sources: [...] }.",
    );
  }

  const parsed = safeParseJson(raw);
  assertRecord(parsed);

  const sources = (parsed["sources"] as unknown) ?? [];
  if (!Array.isArray(sources)) throw new Error("Invalid config: sources must be an array");

  return {
    last_synchronization_timestamp: parsed["last_synchronization_timestamp"] ? String(parsed["last_synchronization_timestamp"]) : undefined,
    sources: sources.map((s) => s as FundingSourceConfig),
  };
}
