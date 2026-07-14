import type { FundingConnector, FundingSourceConfig, ConnectorContext, ConnectorOpportunity } from "../types";

// NOTE: Avoid hardcoded URLs in code; endpoint comes from config.feed_url.
const RELIEFWEB_URL_GUESSING_PROHIBITED = true;

function cleanCdata(s: string) {
  return s.replace(/<!\[CDATA\[|\]\]>/g, "");
}

function normalizeWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function looksLikeXml(text: string) {
  // permissive: detect any XML-ish root
  return /<\s*\w+[:\w-]*/.test(text);
}

function safeXmlParseRoot(xmlText: string): string | null {
  try {
    const m = xmlText.match(/<\s*([a-zA-Z_][\w:.-]*)\b[^>]*>/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

type FeedDetection = {
  type: "rss" | "atom" | "unknown";
};

function detectFeedType(contentTypeHeader: string | null, xmlText: string): FeedDetection {
  const ct = (contentTypeHeader ?? "").toLowerCase();
  const root = safeXmlParseRoot(xmlText)?.toLowerCase() ?? "";

  // Content-Type first
  const ctLooksXml = ct.includes("xml") || ct.includes("rss") || ct.includes("atom") || ct.includes("text/xml");
  if (ctLooksXml) {
    if (ct.includes("atom")) return { type: "atom" };
    if (ct.includes("rss") || ct.includes("rss+xml")) return { type: "rss" };
  }

  // XML root element
  if (root.includes("feed")) return { type: "atom" };
  if (root.includes("rss")) return { type: "rss" };

  // Heuristics as fallback (still not strict-regex-only)
  if (/<\s*entry\b/i.test(xmlText)) return { type: "atom" };
  if (/<\s*channel\b/i.test(xmlText) || /<\s*item\b/i.test(xmlText)) return { type: "rss" };

  return { type: "unknown" };
}

function extractItemsRss(xml: string, maxItems: number): ConnectorOpportunity[] {
  const out: ConnectorOpportunity[] = [];

  const itemBlocks = Array.from(xml.matchAll(/<item\b[^>]*>[\s\S]*?<\/item>/gi));
  const blocks = itemBlocks.length ? itemBlocks.map((m) => m[0]) : [];

  for (const block of blocks) {
    const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
    const pubMatch = block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i) || block.match(/<dc:date\b[^>]*>([\s\S]*?)<\/dc:date>/i);

    const title = titleMatch ? normalizeWhitespace(cleanCdata(String(titleMatch[1] ?? ""))) : null;
    let url = linkMatch ? normalizeWhitespace(cleanCdata(String((linkMatch[1] ?? "") as any))) : null;
    const pubDate = pubMatch ? normalizeWhitespace(cleanCdata(String(pubMatch[1] ?? ""))) : null;

    if (url && !/^https?:\/\//i.test(url)) url = null;
    if (!title || !url) continue;

    out.push({
      funder: "ReliefWeb",
      source: "reliefweb",
      title,
      url,
      deadline: pubDate ? new Date(pubDate).toISOString() : null,
      is_verified: true,
      is_active: true,
    });

    if (out.length >= maxItems) break;
  }

  return out;
}

function extractItemsAtom(xml: string, maxItems: number): ConnectorOpportunity[] {
  const out: ConnectorOpportunity[] = [];

  const entryBlocks = Array.from(xml.matchAll(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi));
  const blocks = entryBlocks.length ? entryBlocks.map((m) => m[0]) : [];

  for (const block of blocks) {
    const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch =
      Array.from(block.matchAll(/<link\b[^>]*>/gi)).map((m) => m[0]).find((t) => /rel=["']alternate["']|rel=["']self["']|href/i.test(t)) ?? block;
    const hrefMatch = linkMatch ? linkMatch.match(/href=["']([^"']+)["']/i) : null;
    const pubMatch = block.match(/<(?:updated|published)\b[^>]*>([\s\S]*?)<\/(?:updated|published)>/i);

    const title = titleMatch ? normalizeWhitespace(cleanCdata(String(titleMatch[1] ?? ""))) : null;
    let url = hrefMatch ? normalizeWhitespace(cleanCdata(String(hrefMatch[1] ?? ""))) : null;
    const pubDate = pubMatch ? normalizeWhitespace(cleanCdata(String(pubMatch[1] ?? ""))) : null;

    if (url && !/^https?:\/\//i.test(url)) url = null;
    if (!title || !url) continue;

    out.push({
      funder: "ReliefWeb",
      source: "reliefweb",
      title,
      url,
      deadline: pubDate ? new Date(pubDate).toISOString() : null,
      is_verified: true,
      is_active: true,
    });

    if (out.length >= maxItems) break;
  }

  return out;
}

async function fetchWithTimeout(url: string, timeoutMs: number, headers: Record<string, string>) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { headers, signal: ctrl.signal });
    return resp;
  } finally {
    clearTimeout(t);
  }
}

async function fetchWithRetry(url: string, opts: { attempts: number; timeoutMs: number; headers: Record<string, string> }) {
  let lastErr: unknown;

  for (let i = 0; i < opts.attempts; i++) {
    try {
      const resp = await fetchWithTimeout(url, opts.timeoutMs, opts.headers);
      return resp;
    } catch (e) {
      lastErr = e;
      // backoff
      await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    }
  }

  throw lastErr ?? new Error("Unknown fetch retry error");
}

const ReliefWebConnector: FundingConnector = {
  sourceName: "ReliefWeb",
  async sync(config: FundingSourceConfig, ctx: ConnectorContext) {
    const feedUrl = config.feed_url;
    if (!feedUrl) {
      return {
        ok: false,
        opportunities: [],
        shouldDisableSource: true,
        error: "Missing feed_url for ReliefWeb connector",
      } as any;
    }

    // Retry+timeout
    const resp = await fetchWithRetry(feedUrl, {
      attempts: 3,
      timeoutMs: 15000,
      headers: {
        "User-Agent": "LaunchPadAfricaBot/1.0",
        Accept: "application/rss+xml,text/xml;q=0.9,application/atom+xml;q=0.8,application/xml;q=0.8,*/*;q=0.5",
      },
    });

    if (!resp.ok) {
      return {
        ok: false,
        opportunities: [],
        shouldDisableSource: true,
        error: `ReliefWeb feed fetch failed: HTTP ${resp.status}`,
      } as any;
    }

    const contentType = resp.headers.get("content-type");
    const xmlText = await resp.text();

    if (!looksLikeXml(xmlText)) {
      // malformed/non-xml
      return { ok: false, opportunities: [], error: "ReliefWeb: response not XML", shouldDisableSource: false } as any;
    }

    const detection = detectFeedType(contentType, xmlText);
    if (detection.type === "unknown") {
      // Graceful: try both extractors
      let opportunities = extractItemsRss(xmlText, config.max_items ?? 50);
      if (!opportunities.length) opportunities = extractItemsAtom(xmlText, config.max_items ?? 50);

      return {
        ok: true,
        opportunities,
      } as any;
    }

    let opportunities: ConnectorOpportunity[] = [];
    if (detection.type === "rss") opportunities = extractItemsRss(xmlText, config.max_items ?? 50);
    if (detection.type === "atom") opportunities = extractItemsAtom(xmlText, config.max_items ?? 50);

    // Ensure opportunities already normalized to funding_opportunities schema fields later.
    // Expiration logic: without detail-page parse yet, keep active unless future deadline clearly expired.
    const nowMs = Date.now();
    opportunities = opportunities.slice(0, config.max_items ?? 50).map((opp) => {
      if (!opp.deadline) return opp;
      const dlMs = Date.parse(opp.deadline as any);
      const isExpired = Number.isFinite(dlMs) ? dlMs < nowMs : false;
      return { ...opp, is_active: !isExpired };
    });

    return {
      ok: true,
      opportunities,
    } as any;
  },
};

export default ReliefWebConnector;
