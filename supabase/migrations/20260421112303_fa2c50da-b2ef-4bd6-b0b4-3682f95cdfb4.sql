DROP POLICY IF EXISTS "Investor profiles viewable by authenticated" ON public.investor_profiles;
CREATE POLICY "Users can view own investor profile"
ON public.investor_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all investor profiles" ON public.investor_profiles;
CREATE POLICY "Admins can view all investor profiles"
ON public.investor_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Published startups viewable by everyone" ON public.startups;

DROP POLICY IF EXISTS "Users can delete own verification docs" ON storage.objects;