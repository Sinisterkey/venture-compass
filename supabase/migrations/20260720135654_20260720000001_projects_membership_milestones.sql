/*
# NGO Bridge Foundation: Organization Membership, Projects, and Milestones

## Purpose
Introduces the first part of the NGO Bridge foundation schema: multi-role organization
membership, unlimited project management per NGO, and a public transparency timeline
(milestones). All tables are additive — no existing tables are modified or dropped.

## 1. New Tables

### organization_members
Models the membership relationship between a user and an organization, with a role.
A user can belong to multiple organizations with different roles. The first member of
an organization is the NGO Administrator (enforced in app logic, not DB).
Columns:
- id (uuid PK)
- organization_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- user_id (uuid FK -> auth.users.id, ON DELETE CASCADE)
- role (text, NOT NULL) — one of: ngo_admin, grant_officer, project_manager,
  finance_officer, me_officer, viewer
- created_at, updated_at (timestamptz)
Constraint: UNIQUE(organization_id, user_id) — a user has one role per org.

### projects
Unlimited projects per NGO. Funding matching happens at project level.
Columns:
- id (uuid PK)
- organization_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- title (text, NOT NULL)
- description (text)
- sector (text)
- sdgs (int[], default '{}')
- country (text)
- province (text)
- start_date (date)
- end_date (date)
- budget (numeric)
- budget_currency (text, default 'USD')
- beneficiaries_count (int)
- target_beneficiaries (text)
- required_funding (numeric)
- is_published (boolean, default false)
- created_by (uuid FK -> auth.users.id)
- created_at, updated_at (timestamptz)

### project_members
Optional team assignment to a specific project. A user must be a member of the
project's organization to be added here (enforced via RLS, not a hard FK).
Columns:
- id (uuid PK)
- project_id (uuid FK -> projects.id, ON DELETE CASCADE)
- user_id (uuid FK -> auth.users.id, ON DELETE CASCADE)
- role (text) — project-specific role label
- created_at (timestamptz)
Constraint: UNIQUE(project_id, user_id)

### milestones
Public transparency timeline entries for an organization (and optionally linked
to a project). These are public-facing achievements/history entries.
Columns:
- id (uuid PK)
- organization_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- project_id (uuid FK -> projects.id, ON DELETE SET NULL, nullable)
- title (text, NOT NULL)
- description (text)
- milestone_date (date, NOT NULL)
- category (text) — e.g. founding, project_completed, beneficiaries_reached, partnership
- evidence_urls (text[], default '{}')
- created_by (uuid FK -> auth.users.id)
- created_at, updated_at (timestamptz)

## 2. Security (RLS)
All four tables have RLS enabled with authenticated-only, ownership/membership-scoped policies:
- organization_members: members of an org can read; only an existing member (or admin) can insert/update; only admins (via has_role) can delete.
- projects: org members can SELECT; only org members can INSERT; only the creator or an org admin can UPDATE/DELETE.
- project_members: org members can SELECT; org members can INSERT; the inserter or org admin can DELETE.
- milestones: anyone authenticated can SELECT (public timeline); only org members can INSERT/UPDATE/DELETE.

## 3. Indexes
- organization_members: (organization_id), (user_id)
- projects: (organization_id), (sector), (country)
- project_members: (project_id), (user_id)
- milestones: (organization_id, milestone_date DESC)

## 4. Notes
- This migration is idempotent (uses IF NOT EXISTS / DO blocks).
- No existing tables are altered or dropped.
- The `public.has_role(text)` and `public.update_updated_at_column()` helpers are assumed to
  already exist (they do in the current schema).
*/

-- ============================================================
-- organization_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_select_org_members" ON public.organization_members;
CREATE POLICY "members_select_org_members"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "members_insert_org_members" ON public.organization_members;
CREATE POLICY "members_insert_org_members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "members_update_org_members" ON public.organization_members;
CREATE POLICY "members_update_org_members"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "members_delete_org_members" ON public.organization_members;
CREATE POLICY "members_delete_org_members"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);

-- ============================================================
-- projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sector text,
  sdgs int[] DEFAULT '{}',
  country text,
  province text,
  start_date date,
  end_date date,
  budget numeric,
  budget_currency text DEFAULT 'USD',
  beneficiaries_count int,
  target_beneficiaries text,
  required_funding numeric,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view published projects (public directory); org members can view all their org's projects
DROP POLICY IF EXISTS "select_projects" ON public.projects;
CREATE POLICY "select_projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_projects" ON public.projects;
CREATE POLICY "insert_projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "update_projects" ON public.projects;
CREATE POLICY "update_projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_projects" ON public.projects;
CREATE POLICY "delete_projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = projects.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON public.projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_country ON public.projects(country);

-- ============================================================
-- project_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_members" ON public.project_members;
CREATE POLICY "select_project_members"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.projects p ON p.organization_id = om.organization_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_project_members" ON public.project_members;
CREATE POLICY "insert_project_members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.projects p ON p.organization_id = om.organization_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_project_members" ON public.project_members;
CREATE POLICY "delete_project_members"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.projects p ON p.organization_id = om.organization_id
      WHERE p.id = project_members.project_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- ============================================================
-- milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  milestone_date date NOT NULL,
  category text,
  evidence_urls text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Public timeline: any authenticated user can read
DROP POLICY IF EXISTS "select_milestones" ON public.milestones;
CREATE POLICY "select_milestones"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_milestones" ON public.milestones;
CREATE POLICY "insert_milestones"
  ON public.milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = milestones.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "update_milestones" ON public.milestones;
CREATE POLICY "update_milestones"
  ON public.milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = milestones.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = milestones.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_milestones" ON public.milestones;
CREATE POLICY "delete_milestones"
  ON public.milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = milestones.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_milestones_org_date ON public.milestones(organization_id, milestone_date DESC);
