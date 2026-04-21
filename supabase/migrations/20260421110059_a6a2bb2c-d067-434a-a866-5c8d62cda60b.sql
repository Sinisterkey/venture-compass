-- Fix 1: Restrict profiles SELECT — users can see only their own full profile
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a public-safe view that exposes only non-sensitive fields for directory/discovery use
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  country,
  city,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- Fix 2: Allow users to delete their own verification documents
CREATE POLICY "Users can delete own verification docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
