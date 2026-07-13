# LaunchPad Africa — Funding Intelligence Platform (Improvement Plan)

## Safety / Non-breaking constraints
- Do not break existing UI pages (especially `src/pages/FundingIntelligence.tsx`).
- Do not delete production data tables (only additive migrations unless explicitly agreed).
- Do not introduce live web scraping during user search/matching flows.
- All improvements must preserve the existing “local DB query” behavior.

---

## Phase 1 — Baseline understanding (completed / in progress)
- [x] Inspect Supabase edge functions:
  - [x] `_shared/ai.ts` (Lovable AI gateway + structured outputs)
  - [x] `ingest-funding-sources` (RSS live fetch; upserts into `funding_opportunities`)
  - [x] `ai-discover-funders` (heuristic candidate shortlist + LLM scoring; writes `funding_matches`)
  - [x] `ai-funding-probability` (LLM probability; reads `investor_profiles`)
  - [x] `ai-match` (investor ↔ organization; currently not NGO ↔ opportunity KB)
  - [x] `clear-funding-opportunities` (hard delete all opportunities)
  - [x] `clear-funding-results` (delete matches per organization)
  - [x] `mcp` tools (local DB reads; `run_funding_discovery` invokes `ai-discover-funders`)
- [x] Inspect migrations for funding schema:
  - [x] `funding_opportunities` table exists
  - [x] `funding_matches` table exists
  - [x] No pgvector / embeddings tables/columns found in migrations reviewed

---

## Phase 2 — Architectural alignment with master prompt (requirements gap analysis)
- [ ] Define canonical “Funding Opportunity” JSON schema mapping to existing DB
  - [x] Confirm/introduce fields mapping (canonical target):
    `title, summary, funder, countries, regions, eligible_organizations, focus_areas, sdgs, keywords,
     minimum_budget, maximum_budget, currency, deadline, application_url, source_name, source_url,
     published_date, last_updated, status`
  - [x] Map canonical schema onto current `funding_opportunities` columns (current DB columns):
    - `funder, title, summary, url, sectors, sdgs, countries, beneficiary_types, min_amount, max_amount,
       currency, deadline, source, is_verified, is_active, created_at, updated_at`
  - [x] Identify missing columns in DB (from the canonical schema):
    - `regions, eligible_organizations, focus_areas, keywords`
    - `application_url` (current field is `url`)
    - `published_date, last_updated, status` (current: created_at/updated_at and is_active)
    - `source_url` (current: only `source`)
- [ ] Enforce “two independent AI systems”
  - [ ] Funding Intelligence Engine boundary:
    - ingestion/connectors + validation + canonical normalization + write to DB
    - runs in background (or scheduled) only
  - [ ] AI Matching Engine boundary:
    - reads ONLY local knowledge base DB tables
    - generates embeddings only from local stored documents/profile fields
    - never performs live web search

- [ ] Decide matching strategy in absence of pgvector
  - [ ] Temporary: improve current `ai-discover-funders` shortlist quality (still local DB + LLM)
  - [ ] Planned: add embeddings + vector search (pgvector) only after DB readiness is confirmed
  - [ ] Add feature flags so existing behavior remains stable

---

## Phase 3 — Implement safe improvements without breaking UX
- [ ] Replace destructive clear with safer lifecycle controls
  - [ ] Add soft-archive fields to opportunities (e.g., `status`, `archived_at`) OR
  - [ ] Add migration-compatible “soft clear” option while preserving current endpoints
- [ ] Connector normalization layer
  - [ ] Refactor `ingest-funding-sources` to use connector modules:
    - ReliefWebConnector
    - UNDPConnector
    - DevexConnector
  - [ ] Each connector returns canonical JSON schema only (no site-specific structure)
- [ ] Validation + dedupe improvements
  - [ ] URL normalization before dedupe
  - [ ] Duplicate detection beyond exact URL (title+funder hash / fuzzy)
  - [ ] Deadline validity checks
  - [ ] URL validation
  - [ ] Update existing rows instead of inserting duplicates

---

## Phase 4 — True semantic matching (embeddings/vector search)
- [ ] Add pgvector + embeddings schema (requires new migrations)
  - [ ] Confirm target provider for embeddings (existing Lovable AI gateway vs dedicated model)
  - [ ] Create tables/columns:
    - opportunities embeddings
    - organization profile embeddings
    - metadata + versioning
- [ ] Implement vector search in matching engine
  - [ ] New function: `ai-match-ngouopportunities` (or repurpose existing)
  - [ ] Compute embeddings from local `organizations` + funding opportunity fields
  - [ ] Query nearest opportunities using pgvector
  - [ ] Feed top-N into LLM to generate reasons/gaps (grounded)

- [ ] Guarantee local-only rule
  - [ ] Add hard guardrails: matching functions must not fetch HTTP (unless explicitly approved)

---

## Phase 5 — Continuous background updates (engine)
- [ ] Turn ingestion from user-triggered “refresh” into background job trigger
  - [ ] Prefer scheduled execution (implementation depends on current Supabase setup)
  - [ ] Add retry + connector health logging
  - [ ] Add crawler logs table and write events from connectors

---

## Phase 6 — Admin dashboard metrics
- [ ] Create/extend admin UI metrics:
  - total connectors
  - successful/failed crawls
  - new/expired opportunities
  - active grants counts
  - last synchronization per source
  - duplicate detection counts
  - crawler health + execution times

---

## Phase 7 — Documentation
- [ ] Document new connector template interface
- [ ] Document data normalization rules
- [ ] Document matching output schema and how explanations are generated

---

## Current priorities (what we’ll do next)
1) Confirm DB column coverage vs canonical schema (fields missing: keywords/regions/application_url/published_date/status/…)
2) Confirm whether any embedding logic exists elsewhere in codebase
3) Draft non-breaking plan for:
   - upgrading normalization/validation inside `ingest-funding-sources`
   - improving `ai-discover-funders` to behave closer to “Matching Engine” over local KB
4) Blocker: Supabase edge function TypeScript diagnostics (Deno/npm typing) are causing editor errors during edits. Before further backend refactors, configure TS to understand Deno edge environment so code changes don’t become risky due to tooling mismatches.
