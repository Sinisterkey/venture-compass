ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS summary text;

DROP POLICY IF EXISTS "Anyone can view published proposals" ON public.proposals;
CREATE POLICY "Anyone can view published proposals"
ON public.proposals FOR SELECT
TO authenticated, anon
USING (is_published = true);

GRANT SELECT ON public.proposals TO anon;