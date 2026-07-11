# ReliefWeb ingestion notes (to implement)

Goal: Add a second provider to `ingest-funding-sources` while keeping IFRC working.

## Desired output for each opportunity row
Insert/upsert into `public.funding_opportunities` with:
- `funder`: provider/publisher (e.g., "ReliefWeb")
- `title`
- `summary`
- `url`: **deep link** to the specific ReliefWeb posting
- `source`: e.g. "reliefweb"
- `is_verified`: true only when deep link + title are extracted reliably
- `is_active`: true only when deadline is not clearly expired (or if unknown)
- `sectors`: best-effort normalization from text
- `countries`: extracted country names/regions (best-effort)
- `sdgs`: optional (only if extracted)
- `beneficiary_types`: optional (only if extracted)
- `min_amount/max_amount/currency`: only if explicitly present
- `deadline`: only if explicitly present

## Implementation approach
Because ReliefWeb pages vary by content type:
1) Start with **ReliefWeb search endpoint / RSS feed** to get high-volume candidates.
2) For each candidate:
   - normalize title + deep link
   - optionally fetch detail page HTML and extract deadline/amount if present.
3) Upsert by `url` (for now, to avoid schema migrations).

## Safety
- Do not remove IFRC provider code.
- Implement provider in a way that failures for ReliefWeb do not prevent IFRC ingestion.
- Add provider-specific logging counters.

