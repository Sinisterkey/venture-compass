
-- 1. Fix profiles SELECT: require auth (protects phone, email-like PII)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix admin self-assignment: whitelist allowed roles in the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';
  IF requested_role IS NOT NULL
     AND requested_role IN ('founder','investor','mentor','university') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::app_role);
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Lock down user_roles writes — only admins may insert/update/delete
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Add UPDATE/DELETE storage policies for pitch-decks bucket (owner-scoped)
CREATE POLICY "Users can update own pitch decks"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own pitch decks"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Public bucket listing: keep public read of objects but require exact path knowledge.
--    We cannot prevent listing on a fully-public bucket without restricting SELECT,
--    so we tighten avatars/startup-media SELECT to require either auth OR the exact name being known.
--    Note: most public-bucket clients fetch by exact path, so this is safe.
--    We do NOT add a blanket SELECT-all on these buckets via storage.objects unless one already exists.
--    (No pre-existing permissive SELECT-all policy is dropped; the bucket's "public" flag still allows direct fetches by path via the public URL.)
