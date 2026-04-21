CREATE OR REPLACE FUNCTION public.can_view_pitch_deck(_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.startups s
    WHERE s.pitch_deck_url = _object_name
      AND (
        s.founder_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          s.is_published = true
          AND public.has_role(auth.uid(), 'investor'::public.app_role)
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Users can view own pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Investors can view published startup pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all pitch decks" ON storage.objects;
CREATE POLICY "Authorized users can view pitch decks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks'
  AND public.can_view_pitch_deck(name)
);

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can view startup media" ON storage.objects;
CREATE POLICY "Public can view startup media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'startup-media');