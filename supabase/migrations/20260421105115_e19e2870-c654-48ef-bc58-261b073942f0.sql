
-- Public buckets (avatars, startup-media): public URLs still serve files without
-- needing any storage.objects SELECT policy. Removing the broad SELECT prevents
-- anonymous enumeration / listing while keeping legitimate <img src=publicUrl> usage working.
DROP POLICY IF EXISTS "Avatars: authenticated users can read" ON storage.objects;
DROP POLICY IF EXISTS "Startup media: authenticated users can read" ON storage.objects;
