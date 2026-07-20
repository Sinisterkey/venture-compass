import type { FundingConnector, FundingSourceConfig, ConnectorContext, ConnectorOpportunity } from "../types.ts";

function ensureUrl(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim();
  return v.length ? v : null;
}

const UNDPConnector: FundingConnector = {
  sourceName: "UNDP",
  async sync(config: FundingSourceConfig, _ctx: ConnectorContext) {
    const feedUrl = ensureUrl(config.feed_url) ?? ensureUrl(config.api_endpoint) ?? null;
    if (!feedUrl) {
      return {
        ok: false,
        opportunities: [],
        shouldDisableSource: true,
        error: "UNDP: missing feed_url/api_endpoint in config",
      } as any;
    }

    const headers: Record<string, string> = {
      "User-Agent": "LaunchPadAfricaBot/1.0",
      Accept: "application/rss+xml,text/xml;q=0.9,application/atom+xml;q=0.8,*/*;q=0.5",
    };

    const timeoutMs = 15000;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      // Retry logic (basic)
      let lastErr: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const resp = await fetch(feedUrl, { headers, signal: ctrl.signal });
          if (!resp.ok) throw new Error(`UNDP feed HTTP ${resp.status}`);

          const xmlText = await resp.text();
          // NOTE: Parsing not implemented in this connector stub yet (verified endpoints to be added later).
          // For now, return empty list but keep connector healthy if endpoint works.
          return {
            ok: true,
            opportunities: [] as ConnectorOpportunity[],
          } as any;
        } catch (e) {
          lastErr = e;
          // backoff before retry
          await new Promise((r) => setTimeout(r, 250 * attempt));
        }
      }

      return {
        ok: false,
        opportunities: [],
        shouldDisableSource: true,
        error: `UNDP endpoint failed: ${(lastErr as Error)?.message ?? String(lastErr)}`,
      } as any;
    } finally {
      clearTimeout(t);
    }
  },
};

export default UNDPConnector;
