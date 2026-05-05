-- Extend the published_startups view so the Discover/Venture pages can render
-- everything that founders submit through CreateStartup.
DROP VIEW IF EXISTS public.published_startups;

CREATE VIEW public.published_startups
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.founder_id,
  s.name,
  s.description,
  s.industry,
  s.funding_stage,
  s.current_stage,
  s.innovation_category,
  s.funding_requested,
  s.problem_statement,
  s.solution,
  s.target_market,
  s.business_model,
  s.milestones,
  s.is_university_project,
  s.university_name,
  s.logo_url,
  s.website,
  s.demo_video_url,
  s.pitch_deck_url,
  p.full_name AS founder_name,
  p.city,
  p.country,
  s.created_at
FROM public.startups s
LEFT JOIN public.public_profiles p ON p.user_id = s.founder_id
WHERE s.is_published = true;

GRANT SELECT ON public.published_startups TO anon, authenticated;