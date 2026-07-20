/*
# NGO Bridge Foundation: Application Tracking and Partnership Requests

## Purpose
Adds grant/application tracking (the NGO's funding activities workspace) and the
partnership/collaboration request system. All additive — no existing tables modified.

## 1. New Tables

### applications
Tracks an NGO's funding activity for a specific opportunity. NOT auto-submission —
this is the NGO's internal workspace for managing their application lifecycle.
Columns:
- id (uuid PK)
- organization_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- project_id (uuid FK -> projects.id, ON DELETE SET NULL, nullable) — optional link to the project being funded
- opportunity_id (uuid FK -> funding_opportunities.id, ON DELETE SET NULL, nullable) — optional link to a discovered opportunity
- owner_id (uuid FK -> auth.users.id, ON DELETE SET NULL)
- status (text, NOT NULL, default 'researching') — one of:
  researching, interested, preparing, submitted, under_review, awarded, rejected
- funder_name (text) — denormalized for resilience if opportunity is deleted
- title (text, NOT NULL) — application/proposal title
- amount_requested (numeric)
- currency (text, default 'USD')
- submission_date (date)
- submission_method (text) — e.g. email, portal, courier
- reference_number (text) — funder's reference after submission
- deadline (date)
- notes (text)
- created_at, updated_at (timestamptz)

### application_tasks
Checklist tasks within an application workspace.
Columns:
- id (uuid PK)
- application_id (uuid FK -> applications.id, ON DELETE CASCADE)
- title (text, NOT NULL)
- description (text)
- assignee_id (uuid FK -> auth.users.id, ON DELETE SET NULL, nullable)
- due_date (date)
- is_completed (boolean, default false)
- completed_at (timestamptz)
- created_at, updated_at (timestamptz)

### application_documents
Documents attached to an application (e.g. proposal PDF, budget, letters of support).
Storage paths reference Supabase Storage.
Columns:
- id (uuid PK)
- application_id (uuid FK -> applications.id, ON DELETE CASCADE)
- title (text, NOT NULL)
- doc_type (text) — e.g. proposal, budget, letter, report, other
- storage_path (text, NOT NULL)
- uploader_id (uuid FK -> auth.users.id, ON DELETE SET NULL)
- created_at (timestamptz)

### partnership_requests
NGO-to-NGO collaboration requests (consortium, implementation partner, research partner, etc.).
Distinct from connection_requests (which are NGO-to-investor).
Columns:
- id (uuid PK)
- requester_org_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- recipient_org_id (uuid FK -> organizations.id, ON DELETE CASCADE)
- requester_id (uuid FK -> auth.users.id, ON DELETE SET NULL) — the user who sent it
- collaboration_type (text, NOT NULL) — e.g. implementation_partner, consortium_member, research_partner, joint_application
- title (text, NOT NULL)
- message (text)
- status (text, NOT NULL, default 'pending') — pending, accepted, declined
- responded_at (timestamptz)
- created_at, updated_at (timestamptz)

## 2. Security (RLS)
- applications: org members can SELECT/INSERT; owner or org admin can UPDATE; org admin can DELETE.
- application_tasks: org members (via application's org) can SELECT/INSERT; assignee or org admin can UPDATE/DELETE.
- application_documents: org members can SELECT/INSERT; uploader or org admin can DELETE.
- partnership_requests: org members of requester or recipient org can SELECT; org members of requester can INSERT; org members of recipient can UPDATE (accept/decline).

## 3. Indexes
- applications: (organization_id), (opportunity_id), (status)
- application_tasks: (application_id), (assignee_id)
- application_documents: (application_id)
- partnership_requests: (recipient_org_id, status), (requester_org_id)

## 4. Notes
- Idempotent (IF NOT EXISTS).
- No existing tables altered.
*/

-- ============================================================
-- applications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.funding_opportunities(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'researching',
  funder_name text,
  title text NOT NULL,
  amount_requested numeric,
  currency text DEFAULT 'USD',
  submission_date date,
  submission_method text,
  reference_number text,
  deadline date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_applications" ON public.applications;
CREATE POLICY "select_applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = applications.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_applications" ON public.applications;
CREATE POLICY "insert_applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = applications.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "update_applications" ON public.applications;
CREATE POLICY "update_applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = applications.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = applications.organization_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_applications" ON public.applications;
CREATE POLICY "delete_applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = applications.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_applications_org_id ON public.applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ============================================================
-- application_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.application_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_application_tasks" ON public.application_tasks;
CREATE POLICY "select_application_tasks"
  ON public.application_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_tasks.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_application_tasks" ON public.application_tasks;
CREATE POLICY "insert_application_tasks"
  ON public.application_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_tasks.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "update_application_tasks" ON public.application_tasks;
CREATE POLICY "update_application_tasks"
  ON public.application_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_tasks.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_tasks.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_application_tasks" ON public.application_tasks;
CREATE POLICY "delete_application_tasks"
  ON public.application_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_tasks.application_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_application_tasks_app_id ON public.application_tasks(application_id);
CREATE INDEX IF NOT EXISTS idx_application_tasks_assignee ON public.application_tasks(assignee_id);

-- ============================================================
-- application_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_type text,
  storage_path text NOT NULL,
  uploader_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_application_documents" ON public.application_documents;
CREATE POLICY "select_application_documents"
  ON public.application_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_documents.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_application_documents" ON public.application_documents;
CREATE POLICY "insert_application_documents"
  ON public.application_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_documents.application_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_application_documents" ON public.application_documents;
CREATE POLICY "delete_application_documents"
  ON public.application_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.applications a ON a.organization_id = om.organization_id
      WHERE a.id = application_documents.application_id
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_application_documents_app_id ON public.application_documents(application_id);

-- ============================================================
-- partnership_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partnership_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  collaboration_type text NOT NULL,
  title text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_partnership_requests" ON public.partnership_requests;
CREATE POLICY "select_partnership_requests"
  ON public.partnership_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id IN (partnership_requests.requester_org_id, partnership_requests.recipient_org_id)
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "insert_partnership_requests" ON public.partnership_requests;
CREATE POLICY "insert_partnership_requests"
  ON public.partnership_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = partnership_requests.requester_org_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "update_partnership_requests" ON public.partnership_requests;
CREATE POLICY "update_partnership_requests"
  ON public.partnership_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = partnership_requests.recipient_org_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = partnership_requests.recipient_org_id
        AND om.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "delete_partnership_requests" ON public.partnership_requests;
CREATE POLICY "delete_partnership_requests"
  ON public.partnership_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id IN (partnership_requests.requester_org_id, partnership_requests.recipient_org_id)
        AND om.user_id = auth.uid()
        AND om.role = 'ngo_admin'
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_partnership_requests_recipient ON public.partnership_requests(recipient_org_id, status);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_requester ON public.partnership_requests(requester_org_id);
