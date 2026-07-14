export type ConnectorType = "API" | "RSS" | "Atom" | "HTML" | "PDF";

export type FundingSourceConfig = {
  source_name: string;
  connector_type: ConnectorType;
  enabled: boolean;

  base_url?: string;
  feed_url?: string;
  api_endpoint?: string;

  requires_api_key?: boolean;
  crawl_interval?: string;

  parser_type?: string;

  max_items?: number;
};

export type FundingSourcesConfigFile = {
  last_synchronization_timestamp?: string;
  sources: FundingSourceConfig[];
};

export type OpportunityUpsertRow = Record<string, unknown>;

export type ProviderIngestionResult = {
  source: string;
  scanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  error?: string;
};

export type IngestionSummary = {
  ok: true;
  inserted: number;
  updated: number;
  providers: ProviderIngestionResult[];
};

export type ConnectorOpportunity = {
  title: string;
  url: string;
  summary?: string;
  funder: string;
  source: string;

  // Optional normalized fields (mapped later onto funding_opportunities columns)
  deadline?: string | null;
  sectors?: string[];
  countries?: string[];
  sdgs?: number[];
  beneficiary_types?: string[];

  min_amount?: number | null;
  max_amount?: number | null;
  currency?: string;

  is_verified?: boolean;
  is_active?: boolean; // unless connector reports expired
};

export type ConnectorContext = {
  nowIso: string;
  lastSyncIso?: string;
};

export type FundingConnector = {
  sourceName: string;
  sync: (config: FundingSourceConfig, ctx: ConnectorContext) => Promise<{
    ok: boolean;
    opportunities: ConnectorOpportunity[];
    // If endpoint is misconfigured/unreachable, connector can report it explicitly
    shouldDisableSource?: boolean;
    error?: string;
  }>;
};
