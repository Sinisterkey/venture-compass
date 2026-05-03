
# LaunchPad Africa — University Innovation Ecosystem Refocus

This plan keeps the current editorial design system, Tailwind tokens, Supabase RLS architecture, routing, and shadcn patterns. It removes AI/scoring/social mechanics and adds structured, institutional workflows around Mukuba University as a primary case study context.

---

## 1. Positioning & Copy Refresh

- Update hero, About page, CTAs, meta tags and `UniversitySpotlight` copy to: *"University-centered innovation ecosystem helping student-led startups gain visibility, mentorship, collaboration, and investment exposure — evaluated using Mukuba University as a primary case study context."*
- Replace "AI matching / pitch scoring" copy everywhere with **"Intelligent rule-based filtering."**
- Make Mukuba University the featured/anchor institution in `UniversitySpotlight` and seed it as the primary university in `showcase_ventures`.
- Remove university *badge* messaging (kept verification, dropped the "badge" framing).

## 2. Removals / Deprecations

- Remove the `ai-match` Edge Function and all calls to it from `Dashboard.tsx`.
- Remove `pitch_score` usage from UI (column kept in DB but hidden); drop any AI scoring text from `CreateStartup`, `Admin`, dashboards.
- Remove follow/watchlist/social/feed/comment hooks if any (none currently wired — confirmed by file list).
- Remove "AI pitch deck analyzer" mention from About/docs.

## 3. Database Migrations

New tables (all with RLS, no AI/scoring fields):

- **`startup_progress`** — `startup_id`, `stage` (enum: `idea | prototype | mvp | pilot | revenue`), `milestone`, `notes`, `updated_at`. RLS: founder writes own; investors/mentors/admin read for published startups.
- **`collaboration_requests`** — `id`, `startup_id`, `requester_id`, `requester_role` (`investor`|`mentor`), `request_type` (enum), `message`, `status` (`pending|accepted|declined`), timestamps. RLS: requester reads own; founder reads requests on own startups; founder updates status; admin reads all.
  - Investor types: `pitch_session`, `meeting`, `prototype_demo`, `additional_info`, `funding_interest`.
  - Mentor types: `offer_mentorship`, `strategy_discussion`, `technical_discussion`.
- **`innovation_events`** — `id`, `title`, `type` (`hackathon|fair|competition|demo_day|pitch_event`), `description`, `university`, `starts_at`, `ends_at`, `location`, `created_by`. RLS: public read; admin write.
- **`event_applications`** — `id`, `event_id`, `startup_id`, `applicant_id`, `status`, `created_at`. RLS: applicant + founder read own; admin manages.

Schema additions:

- `startups`: add `current_stage` (same enum as progress), `innovation_category` text, `milestones` text[].
- `investor_profiles`: add `innovation_categories` text[], `geographic_preferences` text[] (industries/stages/range already exist).
- `mentor_profiles`: add `specialization` text, `preferred_categories` text[] (expertise/industries/availability already exist).

## 4. Rule-Based Recommendation Engine

Replace `ai-match` with a pure-SQL/TS module `src/lib/recommendations.ts`:

- **For investors** → query `startups` where `is_published=true` and any of: `industry ∈ investment_focus`, `funding_stage ∈ preferred_stages`, `innovation_category ∈ innovation_categories`, `funding_requested` within range; rank by count of matched filters (deterministic, no scoring model).
- **For mentors** → query startups where `industry ∈ mentor.industries` OR `current_stage ∈ preferred_categories`.
- **For founders** → list investors/mentors whose preferences include the founder's startup industry/stage/category.
- All filtering done client-side via Supabase queries — no edge function, no LLM.

Dashboard renders results in a structured **table/list** ("Recommended Startups", "Suggested Mentors") rather than match-score cards.

## 5. Pitch Room

New route `/ventures/:id/pitch-room` (and replace current `VentureDetail` body with a structured Pitch Room layout for owner-created startups; showcase ventures keep their summary view).

Sections (clean editorial layout, no social elements):

1. Overview header (name, university, stage badge, country)
2. Problem Statement
3. Proposed Solution
4. Business Model
5. Funding Requirements
6. Pitch Deck (PDF viewer link from `pitch-decks` bucket via signed URL)
7. Demo Video / Media (from `startup-media`)
8. Milestones Achieved (list)
9. Innovation Category & Current Stage progress bar
10. **Request Collaboration** button (investor/mentor only) → opens dialog

## 6. Request Collaboration Workflow

- New component `RequestCollaborationDialog.tsx`:
  - Select request type (filtered by viewer role).
  - Optional short professional message (textarea, 500 char max).
  - Submits row to `collaboration_requests`.
- Founder's Dashboard: new **"Collaboration Requests"** table with Accept/Decline actions updating `status`.
- Investor/Mentor Dashboard: **"My Requests"** table showing status.
- No chat threads, no replies — single structured request + accept/decline only.

## 7. Startup Progress Tracking

- In `CreateStartup` and a new "Edit Startup" view, founder selects `current_stage` from the 5-stage enum and adds milestones.
- Pitch Room and showcase cards display a horizontal stage indicator (Idea → Prototype → MVP → Pilot → Revenue) using existing `Progress` / Tailwind tokens.

## 8. Investor & Mentor Preference Setup

- Extend `Settings.tsx` with role-specific preference panels (multi-select industries, stage chips, range slider for investment, category chips, optional country list).
- Persist to `investor_profiles` / `mentor_profiles`.
- New users routed to a **one-time Preferences step** after registration before reaching Dashboard.

## 9. Campus Innovation Events Module

- New routes:
  - `/events` — public list (table/list view).
  - `/events/:id` — event detail with "Apply with Startup" button for founders.
  - `/admin/events` — admin CRUD.
- Founder dashboard: "My Event Applications" table.
- Investor/mentor dashboard: "Upcoming Events" widget.
- Mukuba University seeded as the host of 2–3 example events.

## 10. Navigation & Page Updates

- Add `Events` link to navbar (visible to all).
- Dashboard reorganized into structured sections per role:
  - **Founder**: My Startups · Progress · Collaboration Requests · Recommended Mentors/Investors · My Event Applications.
  - **Investor**: Preferences · Recommended Startups · My Requests · Upcoming Events.
  - **Mentor**: Preferences · Recommended Startups · My Requests · Upcoming Events.
- Remove "AI Recommendations" headings; rename to "Recommended via filters".

## 11. Technical Cleanup

- Delete `supabase/functions/ai-match/`.
- Update `documentation.txt` (regenerate to reflect new positioning, removed AI, added modules).
- Regenerate Supabase TS types after migrations (auto).
- Keep all existing auth, role guards, RLS function `has_role`, and storage policies intact.

---

## File Changes (high level)

**New**
- `supabase/migrations/<ts>_university_ecosystem.sql` (tables, enums, RLS, seed Mukuba events)
- `src/lib/recommendations.ts`
- `src/components/RequestCollaborationDialog.tsx`
- `src/components/StageProgress.tsx`
- `src/pages/PitchRoom.tsx`
- `src/pages/Events.tsx`, `src/pages/EventDetail.tsx`, `src/pages/AdminEvents.tsx`
- `src/pages/PreferencesSetup.tsx`

**Edited**
- `src/App.tsx` (routes), `src/components/Navbar.tsx` (Events link)
- `src/pages/Dashboard.tsx` (remove ai-match, add structured sections)
- `src/pages/Settings.tsx` (preference panels)
- `src/pages/CreateStartup.tsx` (stage + category + milestones)
- `src/pages/VentureDetail.tsx` (link to Pitch Room)
- `src/pages/About.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/CTASection.tsx`, `src/components/landing/UniversitySpotlight.tsx` (copy refresh, Mukuba focus)
- `src/pages/Admin.tsx` (events management entry, remove AI scoring UI)

**Deleted**
- `supabase/functions/ai-match/index.ts`

The end result: a structured, professional, university-innovation platform — no social feed, no AI scoring, with rule-based recommendations and clear institutional workflows.
