# Memory: index.md
Updated: today

# Project Memory

## Core
- Stack: React, Vite, Tailwind, Supabase (Lovable Cloud). AI via Lovable AI Gateway (google/gemini-3-flash-preview).
- Domain: AI-powered NGO ↔ Funder matching platform. NGOs / community orgs / social enterprises connect with donors, foundations, grant makers, and impact investors.
- 3 roles only: `ngo`, `investor`, `admin`. NO mentor / founder / university roles. Funder/donor/grant-maker all use the `investor` role.
- Brand: "LaunchPad Africa". Space Grotesk + DM Sans. Green/Navy/Gold. Default currency ZMW.
- AI features (edge functions): `ai-readiness`, `ai-funding-probability`, `ai-proposal-assist`, `ai-match`. All call gateway via shared helper at supabase/functions/_shared/ai.ts.
- 3-tier org privacy: Public (mission/sector/funding need) → Protected (proposals/budget/team — requires accepted connection_request) → Confidential (legal/audit docs — requires due_diligence_granted=true).
- Org stages: idea | early | established | scaling | mature.
- Connection workflow: bidirectional `connection_requests` table (direction: ngo_to_investor | investor_to_ngo). No threads — accept/decline + messaging via `org_messages`.
- Engagement tables: `org_likes`, `org_bookmarks`, `org_messages`, `org_profile_views` with trigger-based notifications.
- Storage: `avatars` (public) for user + org logos; `org-documents` (private) for protected/confidential uploads.

## Demo accounts (seeded via admin → Seed demo accounts)
- admin@launchpad.com / admin1234
- ngo@demo.com / demo1234 (owns 6 demo orgs)
- investor@demo.com / demo1234 (Ubuntu Impact Foundation)
