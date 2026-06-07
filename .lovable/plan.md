
# LaunchPad Africa → NGO ↔ Investor AI Platform

Keep brand "LaunchPad Africa". Full replacement of startup domain with NGO domain. Reuse infrastructure (auth, notifications, messages, bookmarks/likes, admin, currency, profile system, navbar, design tokens).

## 1. Database migration (single migration)

**Drop (no longer used):**
- `startups`, `showcase_ventures`, `showcase_investors`, `pitch_sessions`, `mentor_profiles`, `innovation_events`, `event_applications`, `collaboration_requests`, `startup_likes`, `startup_bookmarks`, `startup_messages`, `profile_views`, related enums
- `mentor` from `app_role` enum

**Create:**
- `organizations` — NGO profile (name, logo, mission, sector, country, province, short_description, funding_required, currency, target_beneficiaries, sdgs[], stage, beneficiary_type, impact_area, founded_year, website, is_published, is_verified, readiness_score, funding_probability, ai_strengths[], ai_weaknesses[], ai_suggestions[])
- `organization_documents` — uploaded supporting docs (budget, plans, team, impact reports, financials, legal) with `visibility` enum (`protected`, `confidential`)
- `connection_requests` — bidirectional; `initiator_id`, `recipient_id`, `organization_id`, `direction` (ngo_to_investor | investor_to_ngo), `message`, `status` (pending/accepted/declined), `due_diligence_granted` bool
- `org_likes`, `org_bookmarks`, `org_messages`, `org_profile_views` (mirror old startup engagement tables for orgs)
- Update `investor_profiles`: add `investor_type` (individual/foundation/grant_maker/development_partner/corporate), `preferred_sdgs[]`, `preferred_beneficiaries[]`, `bio`, `organization_name`
- Update `notifications` to reference `organization_id` (nullable) instead of `startup_id`

**Storage buckets:** reuse `avatars`; rename pitch-decks usage → `org-documents` (private), and new `org-logos` (public).

## 2. Edge functions (Lovable AI Gateway, `google/gemini-3-flash-preview`)

- `ai-match` — given investor prefs + list of orgs (or vice versa), return `[{org_id, score, reasons[]}]`
- `ai-readiness` — given org payload, return `{score 0-100, strengths[], weaknesses[], suggestions[]}`. Persist back to `organizations`.
- `ai-funding-probability` — given org payload + investor demand signals, return `{probability 0-100, strengths[], weaknesses[], improvements[]}`. Persist.
- `ai-proposal-assist` — given draft text + objective, return improved description + measurable objectives.

All call gateway via the shared pattern; CORS enabled; auth via Authorization header.

## 3. Frontend rewrites

**Replace pages:**
- `Discover.tsx` → NGO discovery (search by sector, country, SDG, funding amount, stage, beneficiary)
- `VentureDetail.tsx` → `OrganizationDetail.tsx` (public/protected/confidential tiers; investor actions: like, bookmark, express interest, request info, send message)
- `CreateStartup.tsx` → `CreateOrganization.tsx` (multi-section form: identity → mission → funding → SDGs → docs → review with live AI readiness)
- `Dashboard.tsx` → role-aware: NGO dashboard (views, saves, requests, readiness, funding probability, recommended investors) / Investor dashboard (recommended NGOs, saved, sent/accepted requests, conversations)
- `Onboarding.tsx` → 3 roles only
- `Register.tsx` / `RoleSelection.tsx` → NGO, Investor, (Admin via seed)

**Remove pages/routes:** Events, EventDetail, AdminEvents, PitchSession, CreateStartup (replaced)

**New components:**
- `AIMatchScore` (circular % + reasons list)
- `AIReadinessWidget` (score gauge + collapsible recommendations)
- `AIFundingProbability` (gauge + strengths/weaknesses/improvements)
- `ProposalAssistantDialog` (textarea → AI-improved output → copy/apply)
- `InvestorBrowse` (NGO browses investors)
- `ConnectionRequestDialog` (sends connection)
- `OrgDocumentsManager` (upload + visibility selector)

**Keep:** Navbar, NotificationsBell, SendMessageDialog (retarget to org), CurrencySwitcher, Settings, Login, About, Footer, NotFound, design tokens, AuthContext, ProtectedRoute, lib/labels (repurposed), lib/utils, lib/errors.

## 4. Seed & demo accounts

Update `seed-demo-accounts` edge function:
- `admin@launchpad.org` / `admin1234`
- `ngo@demo.com` / `demo1234` (NGO)
- `investor@demo.com` / `demo1234` (Investor)

Seed 6-8 demo organizations across sectors (education, health, agriculture, climate, gender, youth) anchored on Zambia/Mukuba context, and 3-4 demo investors.

## 5. Memory updates

Rewrite `mem://index.md` Core to reflect: NGO↔Investor matching, 3 roles, AI-powered (Lovable AI Gateway, no extra keys), drop mentor / events / pitch sessions / startup vocabulary.

## Technical notes

- All AI calls server-side via edge functions; client never sees gateway key.
- Three-tier privacy enforced at RLS: `public` columns on `organizations` selectable by anon+authenticated; `org_documents` `visibility='protected'` requires accepted connection; `visibility='confidential'` requires `due_diligence_granted=true` connection.
- `has_role` helper unchanged; admin policies reuse it.
- All new public-schema tables include GRANT to authenticated + service_role and (for orgs) anon select on published rows.

## Out of scope (v1)

- Real-time AI streaming chat (use one-shot endpoints).
- Multi-investor due-diligence rooms.
- In-app video calls.

After approval I'll execute in this order:
1. Migration (drop + create + RLS + grants + storage)
2. Edge functions (4 AI + updated seed)
3. Frontend rewrite (pages + components + routes)
4. Memory update
