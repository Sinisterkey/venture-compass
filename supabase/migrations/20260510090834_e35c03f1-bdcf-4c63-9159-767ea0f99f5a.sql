CREATE POLICY "Anyone can view published startups"
ON public.startups
FOR SELECT
USING (is_published = true);