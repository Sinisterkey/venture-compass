
-- IMPACT UPDATES
CREATE TABLE public.impact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  narrative text,
  milestone_type text,
  beneficiaries_count integer,
  amount_spent numeric,
  currency text DEFAULT 'USD',
  period_start date,
  period_end date,
  photos text[] DEFAULT '{}',
  receipts text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.impact_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.impact_updates TO authenticated;
GRANT ALL ON public.impact_updates TO service_role;

ALTER TABLE public.impact_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view impact updates for published orgs"
  ON public.impact_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = impact_updates.organization_id AND o.is_published = true));

CREATE POLICY "NGO owners view own org updates"
  ON public.impact_updates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = impact_updates.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "NGO owners insert updates"
  ON public.impact_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = impact_updates.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "NGO owners update own updates"
  ON public.impact_updates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = impact_updates.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "NGO owners delete own updates"
  ON public.impact_updates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = impact_updates.organization_id AND o.owner_id = auth.uid()));

CREATE POLICY "Admins manage impact updates"
  ON public.impact_updates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER impact_updates_updated_at BEFORE UPDATE ON public.impact_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_impact_updates_org ON public.impact_updates(organization_id, created_at DESC);

-- PROPOSALS
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  template_key text NOT NULL,
  funder_name text,
  title text NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  deadline date,
  total_words integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own proposals"
  ON public.proposals FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins view all proposals"
  ON public.proposals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposals_owner ON public.proposals(owner_id, updated_at DESC);
