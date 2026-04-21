CREATE OR REPLACE VIEW public.published_startups
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.description,
  s.industry,
  s.funding_stage,
  s.is_university_project,
  s.university_name,
  s.logo_url,
  s.website,
  s.demo_video_url,
  p.full_name AS founder_name,
  p.city,
  p.country,
  s.created_at
FROM public.startups s
LEFT JOIN public.public_profiles p ON p.user_id = s.founder_id
WHERE s.is_published = true;

GRANT SELECT ON public.published_startups TO authenticated;

DROP POLICY IF EXISTS "Users can update own verification docs while pending" ON storage.objects;
CREATE POLICY "Users can update own verification docs while pending"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.user_id = auth.uid()
      AND vr.status = 'pending'::public.verification_status
      AND name IN (vr.student_id_url, vr.selfie_url, vr.government_id_url)
  )
)
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own verification docs while pending" ON storage.objects;
CREATE POLICY "Users can delete own verification docs while pending"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.verification_requests vr
    WHERE vr.user_id = auth.uid()
      AND vr.status = 'pending'::public.verification_status
      AND name IN (vr.student_id_url, vr.selfie_url, vr.government_id_url)
  )
);