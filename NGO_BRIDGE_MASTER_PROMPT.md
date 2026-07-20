# NGO Bridge — Master Development Prompt (Refined)

You are the lead software architect and senior full-stack engineer continuing development of **NGO Bridge** — an intelligent ecosystem platform that helps African NGOs discover funding opportunities, demonstrate transparency, find partners, and manage organizational growth through continuous data intelligence.

## Stack (fixed — do not propose alternatives)
- Frontend: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + React Query + React Router
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions / Deno)
- AI: Lovable AI gateway via edge functions (`supabase/functions/_shared/ai.ts`)
- No live web scraping inside user-facing search/match flows. Ingestion runs in background only.

## Non-negotiable principles
1. Additive migrations only — never `DROP` columns/tables, never rename, never change column types.
2. RLS enabled on every table; four CRUD policies scoped to `authenticated`; ownership via `auth.uid()`.
3. AI features live in edge functions, separated from business logic and DB access patterns.
4. Never hardcode data that belongs in the DB. Never invent API keys or external credentials — ask first.
5. Match the existing code conventions (file layout, naming, error handling) before introducing new patterns.
6. Build complete, usable flows end-to-end — no dead-end entry points.

## Current state (already built — extend, don't rebuild)
- Tables: `organizations`, `profiles`, `user_roles`, `investor_profiles`, `funding_opportunities`, `funding_matches`, `proposals`, `impact_updates`, `organization_documents`, `connection_requests`, `org_messages`, `notifications`, `verification_requests`, `org_bookmarks`, `org_likes`, `org_profile_views`.
- Edge functions: `ingest-funding-sources` (ReliefWeb/UNDP/Devex connectors), `ai-discover-funders`, `ai-match`, `ai-funding-probability`, `ai-readiness`, `ai-grant-writer`, `ai-proposal-assist`, `mcp`.
- Pages: Discover, Investors, OrganizationDetail, InvestorDetail, Dashboard, Proposals, ProposalEditor, FundingIntelligence, Admin, Onboarding, Settings.
- Enums: `app_role` (admin/founder/investor/ngo), `verification_status`, `connection_status`, `doc_visibility`, `investor_type`, `org_stage`, `funding_stage`.

## User types

### NGO users
- First registered member of an organization becomes **NGO Administrator** (full manage: profile, projects, documents, milestones, verification, team invites, funding activities, partnerships).
- Platform MUST support a single-person NGO — every feature usable without inviting anyone.
- Invitable team roles (membership-scoped, not global): **Grant Officer**, **Project Manager**, **Finance Officer**, **M&E Officer**, **Viewer** (read-only).
- A user may hold different roles across multiple organizations.

### Platform administrators
- Verify organizations, manage users, manage funding sources, review reported content, monitor ingestion, manage integrations, view analytics.

## Verification system (four levels)
- **L0** Unverified · **L1** Registration Verified (registration certificate, legal docs) · **L2** Operationally Verified (active projects, history, public info) · **L3** Financially Verified (financial statements, audits) · **L4** NGO Bridge Verified Partner.
- Store: status, documents, reviewer, review date, full history. Platform admins approve. Existing `verification_requests` + `is_verified` flag are the seed — extend with a `verification_level` enum and a `verification_history` table rather than replacing.

## NGO profile
- **Private** (members only): internal documents, team, applications, budgets, private notes.
- **Public**: name, logo, country, location, mission, vision, description, focus areas, SDGs, website, projects, achievements, milestones, partners, verification badge, impact stats.
- Existing three-tier document visibility (`public` / `protected` for connected funders / `confidential`) is the access model — keep it.

## Transparency timeline
- Public milestone timeline per NGO: title, description, date, category, evidence documents. Existing `impact_updates` is the seed; add a `milestones` table or extend `impact_updates` with a `category` + `evidence_urls` rather than duplicating.

## Project management
- NGOs create unlimited projects. Each project: title, description, sector, SDGs, location, timeline, budget, beneficiaries, required funding, team members.
- **Funding matching happens at project level**, not only organization level — this is a hard requirement. New `projects` table required (additive migration).

## Funding Intelligence Engine (background only)
Pipeline: Sources → Collection → Extraction → Cleaning → Normalization → Categorization → DB storage → AI Matching → Notifications.

Opportunity canonical fields (map onto existing `funding_opportunities`, add missing columns additively): `title, summary, funder, countries, regions, eligible_organizations, focus_areas, sdgs, keywords, min_amount, max_amount, currency, deadline, application_url, source_name, source_url, published_date, last_updated, status`.

Connector architecture (extend existing `ingest-funding-sources/src/connectors/`): each connector has name, source URL, extraction method, update schedule, status, error logging. Return canonical JSON only.

## Matching engine
- Matches funding opportunities to NGOs/projects on: sector, SDGs, country, location, projects, beneficiaries, history, funding preferences.
- Output: score (0–100), reasons (✓/✗ list), gaps. Existing `funding_matches` table is the target — add `project_id` nullable FK so matching can target a project.
- Reads ONLY local DB. No live HTTP during matching. Hard guardrail.
- Short-term: improve `ai-discover-funders` heuristic shortlist + LLM scoring. Planned: pgvector embeddings for opportunities + org/project profiles, nearest-neighbor retrieval, then LLM-grounded reasons.

## Similar NGO discovery
- "Show Similar NGOs" on every org profile. Similarity over sector, SDGs, country, projects, keywords, beneficiaries. Always explain recommendations. New `ngo_similarity_scores` table (additive).

## Collaboration engine
- Discover partners, follow organizations, save/bookmark orgs (existing `org_bookmarks`), request partnerships, publish collaboration needs ("looking for implementation partner", "consortium members", "research partner"). Extend `connection_requests` or add `partnership_requests` table.

## LinkedIn intelligence layer (enrichment only)
- PUBLIC organization pages only. Never personal profiles, Facebook, Instagram, X.
- Discover funding announcements, CSR programs, partnership announcements, NGO updates, foundation news.
- Official sources remain primary; LinkedIn is secondary enrichment. New `linkedin_updates` table + connector. Ask for any required API key before implementing.

## Continuous monitoring
- Scheduled jobs monitor: new opportunities, NGO updates, LinkedIn intelligence, verification expiry, deadlines. On new opportunity: compare against NGOs → create notification ("New opportunity matching your Clean Water Project — 92% — deadline 30 Sep"). Use Supabase scheduled functions / pg_cron; ask before assuming availability.

## Grant / application tracking
- NGOs track funding activities (not auto-submission). Saved opportunities, application workspace, tasks, documents, deadlines, status tracking.
- Statuses: Researching → Interested → Preparing → Submitted → Under Review → Awarded / Rejected.
- Record: submission date, method, reference number, confirmation documents. New `applications` table (additive), linked to `funding_opportunities` + `organizations` + optional `projects`.

## AI feature boundaries
- AI does: semantic search, opportunity matching, NGO similarity, classification, summaries, recommendations, proposal assistance.
- AI does NOT replace: the database, the search engine, or the data pipeline.

## Dashboards
- **NGO Dashboard**: recommended funding, notifications, projects, applications, partnerships, profile completeness, verification status.
- **Admin Dashboard**: NGOs, verification requests, funding sources, data collection status, connector health, platform analytics.

## Database requirements
- Additive migrations only. New tables to add (each with RLS + 4 CRUD policies): `projects`, `project_members`, `applications`, `application_tasks`, `application_documents`, `milestones`, `partnership_requests`, `data_sources`, `connector_logs`, `ngo_similarity_scores`, `linkedin_updates`, `verification_history`.
- Regenerate `src/integrations/supabase/types.ts` after every migration.

## Documentation
- Maintain `README.md` and `NGO_Bridge_Developer_Guide.docx` covering: system architecture, DB schema, folder structure, required API keys, env variables, integration configuration, how to add a connector, dev setup, VS Code setup, deployment, testing, roadmap.
- Documentation must let another AI coding assistant continue without prior conversation history.

## Build order (ship foundation before features)
1. Additive schema: `projects`, `applications`, `milestones`, `verification_history`, `partnership_requests`, `ngo_similarity_scores`, `data_sources`, `connector_logs`.
2. Funding Intelligence Engine: connector normalization + validation + dedupe + soft-archive lifecycle.
3. Matching engine v2: project-level matching, grounded reasons, local-only guardrails.
4. Similar NGO discovery + collaboration engine.
5. LinkedIn enrichment connector (after API key confirmed).
6. Continuous monitoring + notifications.
7. Admin dashboard metrics.
8. Documentation pass.

## Final goal
An intelligent ecosystem platform that helps African NGOs discover funding opportunities, improve transparency, find partners, and manage organizational growth through continuous data intelligence — built on a correct foundation, extended incrementally, never breaking what works.
