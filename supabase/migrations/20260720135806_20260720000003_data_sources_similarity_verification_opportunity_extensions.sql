/*
# NGO Bridge Foundation: Data Sources, Connector Logs, Similarity, Verification History, Opportunity Extensions

## Purpose
Completes the Phase 1 foundation schema: data pipeline infrastructure (data_sources,
connector_logs), NGO similarity scores, verification history, and additive column
extensions to funding_opportunities and funding_matches. All additive — no drops, no
type changes, no renames.

## 1. New Tables

### data_sources
Registry of configured funding data connectors. Each row describes a source the
ingestion pipeline can pull from.
Columns:
- id (uuid PK)
- name (text, NOT NULL, unique) — human-readable connector name
- source_type (text) — e.g. rss, atom, api, html_scrape
- source_url (text, NOT NULL)
- extraction_method (text) — e.g. reliefweb_api, undp_api, devex_rss
- schedule_cron (text) — cron expression for scheduled runs (nullable)
- is_active (boolean, default true)
- last_run_at (timestamptz)
- created_at, updated_at (timestamptz)

### connector_logs
Per-run execution logs for data connectors. Written by the ingestion edge function.
Columns:
- id (uuid PK)
- data_source_id (uuid FK -> data_sources.id, ON DELETE CASCADE)
- status (text, NOT NULL) — success, partial, failed
- opportunities_found (int, default 0)
- opportunities_inserted (int, default 0)
- opportunities_updated (int, default 0)
- duplicates_skipped (int, default 0)
- error_message (text)
- duration_ms (int)
- started_at (timestamptz, NOT NULL, default now())
- finished_at (timestamptz)

### ngo_similarity_scores
Precomputed similarity between two organizations. Populated by a background job
(not the matching engine for funding). Symmetric — store each pair once.
Columns:
- id (uuid PK)
- org_a_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- org_b_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- score (numeric, NOT NULL) — 0.00 to 100.00
- reasons (text[], default '{}') — human-readable similarity reasons
- computed_at (timestamptz, NOT NULL, default now())
Constraint: UNIQUE(org_a_id, org_b_id) with a CHECK that org_a_id < org_b_id (canonical ordering)

### verification_history
Audit trail of verification level changes for an organization. Each row records a
transition: who reviewed, what level was set, when, and notes.
Columns:
- id (uuid PK)
- organization_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- level (int, NOT NULL) — 0 (unverified) through 4 (verified partner)
- reviewer_id (uuid FK -> auth.users.id, ON DELETE SET NULL)
- status (text, NOT NULL) — pending, approved, rejected, more_info_needed
- notes (text)
- document_paths (text[], default '{}')
- created_at (timestamptz, NOT NULL, default now())

## 2. Additive Column Extensions

### funding_opportunities (add columns)
Adds the missing canonical-schema fields identified in the gap analysis. All nullable
with sensible defaults so existing rows and queries are unaffected.
- regions (text[], default '{}')
- eligible_organizations (text)
- focus_areas (text[], default '{}')
- keywords (text[], default '{}')
- application_url (text)
- source_name (text)
- source_url (text)
- published_date (date)
- status (text, default 'active') — active, archived, expired
- archived_at (timestamptz)

### funding_matches (add column)
- project_id (uuid, nullable, FK -> projects.id, ON DELETE SET NULL)
Allows matching at project level, not just organization level.

## 3. Security (RLS)
- data_sources: admins can SELECT/INSERT/UPDATE/DELETE; authenticated users can SELECT
  (so the admin dashboard and connector health views work for all logged-in users).
- connector_logs: same as data_sources.
- ngo_similarity_scores: any authenticated user can SELECT (public similarity data);
  only admins can INSERT/UPDATE/DELETE (populated by background jobs/service role).
- verification_history: any authenticated user can SELECT (public trust info); only
  admins can INSERT/UPDATE/DELETE.

## 4. Indexes
- data_sources: (is_active)
- connector_logs: (data_source_id, started_at DESC), (status)
- ngo_similarity_scores: (org_a_id), (org_b_id), (score DESC)
- verification_history: (organization_id, created_at DESC)
- funding_opportunities: (status), (archived_at)
- funding_matches: (project_id)

## 5. Notes
- Idempotent: uses IF NOT EXISTS for tables/indexes and DO $$ blocks for column additions.
- No existing columns are dropped, renamed, or type-changed.
- The CHECK constraint on ngo_similarity_scores uses a DO block to avoid errors if
  re-applied.
*/

-- ============================================================
-- data_sources
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  source_type text,
  source_url text NOT NULL,
  extraction_method text,
  schedule_cron text,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_data_sources" ON public.data_sources;
CREATE POLICY "select_data_sources"
  ON public.data_sources FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_data_sources" ON public.data_sources;
CREATE POLICY "insert_data_sources"
  ON public.data_sources FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "update_data_sources" ON public.data_sources;
CREATE POLICY "update_data_sources"
  ON public.data_sources FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "delete_data_sources" ON public.data_sources;
CREATE POLICY "delete_data_sources"
  ON public.data_sources FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_data_sources_active ON public.data_sources(is_active);

-- ============================================================
-- connector_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.connector_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id uuid NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  status text NOT NULL,
  opportunities_found int NOT NULL DEFAULT 0,
  opportunities_inserted int NOT NULL DEFAULT 0,
  opportunities_updated int NOT NULL DEFAULT 0,
  duplicates_skipped int NOT NULL DEFAULT 0,
  error_message text,
  duration_ms int,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.connector_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_connector_logs" ON public.connector_logs;
CREATE POLICY "select_connector_logs"
  ON public.connector_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_connector_logs" ON public.connector_logs;
CREATE POLICY "insert_connector_logs"
  ON public.connector_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "update_connector_logs" ON public.connector_logs;
CREATE POLICY "update_connector_logs"
  ON public.connector_logs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "delete_connector_logs" ON public.connector_logs;
CREATE POLICY "delete_connector_logs"
  ON public.connector_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_connector_logs_source_date ON public.connector_logs(data_source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_connector_logs_status ON public.connector_logs(status);

-- ============================================================
-- ngo_similarity_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ngo_similarity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_b_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  reasons text[] DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_a_id, org_b_id),
  CONSTRAINT ngo_similarity_canonical_order CHECK (org_a_id < org_b_id)
);

ALTER TABLE public.ngo_similarity_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ngo_similarity" ON public.ngo_similarity_scores;
CREATE POLICY "select_ngo_similarity"
  ON public.ngo_similarity_scores FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_ngo_similarity" ON public.ngo_similarity_scores;
CREATE POLICY "insert_ngo_similarity"
  ON public.ngo_similarity_scores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "update_ngo_similarity" ON public.ngo_similarity_scores;
CREATE POLICY "update_ngo_similarity"
  ON public.ngo_similarity_scores FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "delete_ngo_similarity" ON public.ngo_similarity_scores;
CREATE POLICY "delete_ngo_similarity"
  ON public.ngo_similarity_scores FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ngo_sim_org_a ON public.ngo_similarity_scores(org_a_id);
CREATE INDEX IF NOT EXISTS idx_ngo_sim_org_b ON public.ngo_similarity_scores(org_b_id);
CREATE INDEX IF NOT EXISTS idx_ngo_sim_score ON public.ngo_similarity_scores(score DESC);

-- ============================================================
-- verification_history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  level int NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL,
  notes text,
  document_paths text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_verification_history" ON public.verification_history;
CREATE POLICY "select_verification_history"
  ON public.verification_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_verification_history" ON public.verification_history;
CREATE POLICY "insert_verification_history"
  ON public.verification_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "update_verification_history" ON public.verification_history;
CREATE POLICY "update_verification_history"
  ON public.verification_history FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "delete_verification_history" ON public.verification_history;
CREATE POLICY "delete_verification_history"
  ON public.verification_history FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_verification_history_org ON public.verification_history(organization_id, created_at DESC);

-- ============================================================
-- funding_opportunities: additive column extensions
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='regions') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN regions text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='eligible_organizations') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN eligible_organizations text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='focus_areas') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN focus_areas text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='keywords') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN keywords text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='application_url') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN application_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='source_name') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN source_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='source_url') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN source_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='published_date') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN published_date date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='status') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_opportunities' AND column_name='archived_at') THEN
    ALTER TABLE public.funding_opportunities ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_funding_opportunities_status ON public.funding_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_funding_opportunities_archived_at ON public.funding_opportunities(archived_at);

-- ============================================================
-- funding_matches: add project_id
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='funding_matches' AND column_name='project_id') THEN
    ALTER TABLE public.funding_matches ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_funding_matches_project_id ON public.funding_matches(project_id);
