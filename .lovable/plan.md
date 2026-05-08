## Goals

1. Make Events feel visual and editorial (imagery > text), with a dedicated layout per event.
2. Polish the startup Pitch Room and pitch deck presentation.
3. Let founders present live to investors/mentors via an embedded video + screen-share room (Jitsi Meet — no API key required, free, OSS).

---

## 1. Events redesign — visual-first

### Schema (migration)
Add to `innovation_events`:
- `cover_image_url text` — hero image
- `theme_color text` — accent for cards/hero (optional)
- `agenda jsonb` — `[{time, title, speaker?}]`
- `speakers jsonb` — `[{name, role, avatar_url}]`
- `prizes text`, `capacity int`, `registration_deadline timestamptz`

### Event cover images (auto-generated)
- Generate one branded banner per event `type` (hackathon, demo_day, fair, pitch_competition, workshop) into `src/assets/events/` using `imagegen` — used as default when an event has no `cover_image_url`.
- Admin form (`AdminEvents.tsx`) gains optional cover upload to the existing public `startup-media` bucket.

### Events listing (`src/pages/Events.tsx`)
Replace the row list with an editorial magazine layout:
- Featured event hero (largest upcoming) — full-bleed cover, type chip, date, location overlaid.
- Below: 3-column image-led card grid (cover image, type badge, title, date/location, university chip). Minimal copy.
- Filter chips: All / Hackathons / Demo Days / Fairs / Workshops. Tabs for Upcoming / Past.

### Event detail (`src/pages/EventDetail.tsx`)
Bespoke layout (not the current narrow column):
- Full-width hero with cover image, gradient overlay, title, date, location, university badge, countdown.
- Two-column body: left = description, agenda timeline, prizes, speakers grid (avatar cards); right = sticky apply card (status, capacity, deadline, startup picker, submit).
- Past-event variant: replace apply card with "Applications closed" + winners section if present.

---

## 2. Pitch Room polish (`src/pages/VentureDetail.tsx`)

- Larger hero with logo, tagline, key metrics row (stage, category, funding ask, university).
- Tabbed body: **Overview · Pitch Deck · Traction & Milestones · Team · Live Pitch**.
- **Pitch Deck tab**: keep "Open in new tab" (per your choice) but present it as a polished card — deck thumbnail/icon, file name, last-updated date, big "Open Pitch Deck" CTA, secondary "Watch Demo Video" if present.
- Investor-only sidebar: "Request Pitch Session", "Request Meeting", contact founder.
- Founder-owner view: edit shortcuts, request inbox count.

---

## 3. Live online pitching — Embedded Jitsi rooms

We'll use **Jitsi Meet (`@jitsi/react-sdk`)** embedded directly in the platform. Free, no API key, no account needed, supports video, audio, screen-share, chat, recording.

### Schema (migration)
New table `pitch_sessions`:
- `id, collaboration_request_id (fk), startup_id, founder_id, investor_id`
- `room_name text unique` (e.g. `launchpad-<startup-slug>-<short-id>`)
- `scheduled_at timestamptz, duration_minutes int default 30`
- `status: scheduled | live | completed | cancelled`
- `notes text`, `created_at, updated_at`

RLS: founder and invited investor/mentor can SELECT/UPDATE; admins all.

### Workflow
1. Investor sends `pitch_session` collaboration request (existing flow).
2. Founder accepts → modal to schedule date/time → row created in `pitch_sessions` with generated `room_name`.
3. Both parties see the upcoming session on their Dashboard with a "Join Pitch Room" button (enabled within 10 min of `scheduled_at`).
4. New page `src/pages/PitchSession.tsx` (route `/pitch-session/:id`) renders `<JitsiMeeting>` with:
   - Room name from DB, display name from profile, screen-share enabled, prejoin disabled, lobby disabled (only invited parties have URL + RLS guard).
   - Side panel: startup summary, pitch deck quick-open, founder notes (founder-only edit).
5. After session, status → `completed`; investor can leave private feedback (optional `pitch_session_feedback` table).

### New / changed files
- **New**: `supabase/migrations/<ts>_events_visuals_and_pitch_sessions.sql`, `src/pages/PitchSession.tsx`, `src/components/SchedulePitchSessionDialog.tsx`, `src/components/events/EventHero.tsx`, `src/components/events/EventCard.tsx`, `src/assets/events/*.jpg` (5 generated covers).
- **Edited**: `src/pages/Events.tsx`, `src/pages/EventDetail.tsx`, `src/pages/AdminEvents.tsx`, `src/pages/VentureDetail.tsx`, `src/pages/Dashboard.tsx` (upcoming sessions panel + accept-request → schedule), `src/App.tsx` (new route), `src/integrations/supabase/types.ts` (auto).
- **Dependency**: `bun add @jitsi/react-sdk`.

### Memory updates
Add `mem://features/pitch-sessions` and update index Core line to mention Jitsi-based live pitch rooms.

---

## Out of scope
- Recording storage (Jitsi local recording only for now).
- Payments / paid events.
- Public comments / chat outside the live session.
