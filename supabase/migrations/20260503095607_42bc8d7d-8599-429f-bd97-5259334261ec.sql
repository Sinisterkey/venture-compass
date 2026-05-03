
-- Enums
CREATE TYPE public.startup_stage AS ENUM ('idea','prototype','mvp','pilot','revenue');
CREATE TYPE public.collab_request_type AS ENUM (
  'pitch_session','meeting','prototype_demo','additional_info','funding_interest',
  'offer_mentorship','strategy_discussion','technical_discussion'
);
CREATE TYPE public.collab_status AS ENUM ('pending','accepted','declined');
CREATE TYPE public.event_type AS ENUM ('hackathon','fair','competition','demo_day','pitch_event');
CREATE TYPE public.event_app_status AS ENUM ('pending','accepted','rejected','withdrawn');

-- Add fields to startups
ALTER TABLE public.startups
  ADD COLUMN current_stage public.startup_stage DEFAULT 'idea',
  ADD COLUMN innovation_category text,
  ADD COLUMN milestones text[] DEFAULT '{}';

-- Add fields to investor_profiles
ALTER TABLE public.investor_profiles
  ADD COLUMN innovation_categories text[] DEFAULT '{}',
  ADD COLUMN geographic_preferences text[] DEFAULT '{}';

-- Add fields to mentor_profiles
ALTER TABLE public.mentor_profiles
  ADD COLUMN specialization text,
  ADD COLUMN preferred_categories text[] DEFAULT '{}';

-- collaboration_requests
CREATE TABLE public.collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  founder_id uuid NOT NULL,
  requester_id uuid NOT NULL,
  requester_role text NOT NULL CHECK (requester_role IN ('investor','mentor')),
  request_type public.collab_request_type NOT NULL,
  message text,
  status public.collab_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester can view own requests" ON public.collaboration_requests
  FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Founder can view requests on their startups" ON public.collaboration_requests
  FOR SELECT USING (auth.uid() = founder_id);
CREATE POLICY "Admin can view all requests" ON public.collaboration_requests
  FOR SELECT USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Requester can insert" ON public.collaboration_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Founder can update status" ON public.collaboration_requests
  FOR UPDATE USING (auth.uid() = founder_id);

CREATE TRIGGER update_collab_updated_at BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- innovation_events
CREATE TABLE public.innovation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type public.event_type NOT NULL,
  description text,
  university text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.innovation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.innovation_events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.innovation_events FOR ALL
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.innovation_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- event_applications
CREATE TABLE public.event_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.innovation_events(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  status public.event_app_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicant views own applications" ON public.event_applications
  FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Admin views all applications" ON public.event_applications
  FOR SELECT USING (public.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Applicant inserts" ON public.event_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicant updates own" ON public.event_applications
  FOR UPDATE USING (auth.uid() = applicant_id);
CREATE POLICY "Admin manages applications" ON public.event_applications
  FOR ALL USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

CREATE TRIGGER update_event_apps_updated_at BEFORE UPDATE ON public.event_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Mukuba University events
INSERT INTO public.innovation_events (title, type, description, university, location, starts_at, ends_at) VALUES
  ('Mukuba Innovation Hackathon 2026','hackathon','48-hour hackathon for student innovators tackling local challenges in agriculture, education and fintech.','Mukuba University','Kitwe, Zambia', now() + interval '30 days', now() + interval '32 days'),
  ('Mukuba Demo Day','demo_day','Showcase of student-led startups presenting prototypes to invited investors and mentors.','Mukuba University','Kitwe, Zambia', now() + interval '60 days', now() + interval '60 days'),
  ('Campus Innovation Fair','fair','Annual campus innovation fair featuring research projects and student ventures.','Mukuba University','Kitwe, Zambia', now() + interval '90 days', now() + interval '92 days');
