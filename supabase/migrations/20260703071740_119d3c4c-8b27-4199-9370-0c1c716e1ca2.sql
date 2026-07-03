
CREATE TABLE public.funding_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funder text NOT NULL,
  title text NOT NULL,
  summary text,
  url text,
  sectors text[] DEFAULT '{}',
  sdgs int[] DEFAULT '{}',
  countries text[] DEFAULT '{}',
  beneficiary_types text[] DEFAULT '{}',
  min_amount numeric,
  max_amount numeric,
  currency text DEFAULT 'USD',
  deadline date,
  source text,
  is_verified boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding_opportunities TO anon, authenticated;
GRANT ALL ON public.funding_opportunities TO service_role;
ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active opportunities" ON public.funding_opportunities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage opportunities" ON public.funding_opportunities FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_funding_opportunities_updated_at BEFORE UPDATE ON public.funding_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funding_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.funding_opportunities(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  score int NOT NULL,
  reasons text[] DEFAULT '{}',
  gaps text[] DEFAULT '{}',
  is_saved boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, opportunity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding_matches TO authenticated;
GRANT ALL ON public.funding_matches TO service_role;
ALTER TABLE public.funding_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view their matches" ON public.funding_matches FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners update their matches" ON public.funding_matches FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert their matches" ON public.funding_matches FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete their matches" ON public.funding_matches FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_funding_matches_updated_at BEFORE UPDATE ON public.funding_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_funding_matches_org ON public.funding_matches(organization_id, score DESC);
CREATE INDEX idx_funding_opportunities_active ON public.funding_opportunities(is_active, deadline);
