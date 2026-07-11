# TODO — Funding discovery improvements (multi-source)

## Discovery + ingestion (Phase 1)
- [ ] Read current edge-function behavior (already analyzed):
  - [ ] `supabase/functions/ingest-funding-sources/index.ts` (currently IFRC-only)
  - [ ] `supabase/functions/ai-discover-funders/index.ts` (rule prefilter + AI refine)
- [ ] Implement multi-source ingestion framework inside `ingest-funding-sources`.
- [ ] Add **ReliefWeb** provider first.
  - [ ] Fetch candidate listing via ReliefWeb search/RSS.
  - [ ] Extract deep links to the posting detail pages.
  - [ ] Normalize into `public.funding_opportunities` schema.
  - [ ] Upsert/dedupe safely without breaking IFRC ingestion.
- [ ] Add additional providers (sequence):
  - [ ] SAM.gov
  - [ ] Grants.gov
  - [ ] EU Funding & Tenders

## Matching quality (Phase 2)
- [ ] Improve dedupe/versioning beyond url-only once multiple sources are added.
- [ ] Improve AI scoring prompt to penalize missing/low-confidence fields.

## Validation (Phase 3)
- [ ] Verify end-to-end:
  - [ ] `Refresh live sources` inserts opportunities
  - [ ] `Run AI Scan` produces `funding_matches`
  - [ ] “Open funding call” links go to the deep posting URL
- [ ] Add basic logging/metrics per provider: scanned/inserted/updated/skipped.

