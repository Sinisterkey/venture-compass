-- Innovation events: visual + scheduling fields
ALTER TABLE public.innovation_events
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS agenda jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS speakers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prizes text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz;

-- Pitch sessions
DO $$ BEGIN
  CREATE TYPE public.pitch_session_status AS ENUM ('scheduled','live','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.pitch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id uuid,
  startup_id uuid NOT NULL,
  founder_id uuid NOT NULL,
  investor_id uuid NOT NULL,
  room_name text NOT NULL UNIQUE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status public.pitch_session_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founder views own sessions" ON public.pitch_sessions
  FOR SELECT USING (auth.uid() = founder_id);
CREATE POLICY "Investor views own sessions" ON public.pitch_sessions
  FOR SELECT USING (auth.uid() = investor_id);
CREATE POLICY "Admin views all sessions" ON public.pitch_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Founder inserts session" ON public.pitch_sessions
  FOR INSERT WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founder updates session" ON public.pitch_sessions
  FOR UPDATE USING (auth.uid() = founder_id);
CREATE POLICY "Investor updates session" ON public.pitch_sessions
  FOR UPDATE USING (auth.uid() = investor_id);
CREATE POLICY "Admin manages sessions" ON public.pitch_sessions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_pitch_sessions_updated_at
  BEFORE UPDATE ON public.pitch_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pitch_sessions_founder ON public.pitch_sessions(founder_id);
CREATE INDEX IF NOT EXISTS idx_pitch_sessions_investor ON public.pitch_sessions(investor_id);