CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IS NOT NULL
     AND requested_role IN ('founder','investor','mentor') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Investors can view published startup pitch decks" ON storage.objects;
CREATE POLICY "Investors can view published startup pitch decks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks'
  AND public.has_role(auth.uid(), 'investor'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.startups s
    WHERE s.pitch_deck_url = name
      AND s.is_published = true
  )
);

DROP POLICY IF EXISTS "Admins can view all pitch decks" ON storage.objects;
CREATE POLICY "Admins can view all pitch decks"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);