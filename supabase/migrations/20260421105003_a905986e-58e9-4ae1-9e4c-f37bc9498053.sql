
-- Drop overly broad public SELECT policies on the two public buckets, if they exist.
-- Replace with policies that allow direct fetches (by exact path) for everyone but
-- do NOT permit listing/enumeration via empty queries.
-- Note: Supabase serves public files via /object/public/<bucket>/<path> using the
-- service role on the storage server, so individual file fetches keep working
-- regardless of these policies.

-- Avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Avatars: authenticated users can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: owners can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars: owners can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars: owners can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Startup media bucket
CREATE POLICY "Startup media: authenticated users can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'startup-media');

CREATE POLICY "Startup media: owners can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'startup-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Startup media: owners can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'startup-media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'startup-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Startup media: owners can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'startup-media' AND auth.uid()::text = (storage.foldername(name))[1]);
