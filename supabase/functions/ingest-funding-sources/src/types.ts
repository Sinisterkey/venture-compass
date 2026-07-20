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
  duplicates_skipped: number;
  archived: number;
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

  deadline?: string | null;
  sectors?: string[];
  countries?: string[];
  regions?: string[];
  sdgs?: number[];
  beneficiary_types?: string[];
  focus_areas?: string[];
  keywords?: string[];
  eligible_organizations?: string;

  min_amount?: number | null;
  max_amount?: number | null;
  currency?: string;

  application_url?: string;
  source_name?: string;
  source_url?: string;
  published_date?: string | null;

  is_verified?: boolean;
  is_active?: boolean;
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
    shouldDisableSource?: boolean;
    error?: string;
  }>;
};

export type DataSourceRow = {
  id: string;
  name: string;
  source_type: string | null;
  source_url: string;
  extraction_method: string | null;
  schedule_cron: string | null;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};
