
-- =========================================================
-- 1. DROP OLD DOMAIN
-- =========================================================
DROP TABLE IF EXISTS public.event_applications CASCADE;
DROP TABLE IF EXISTS public.innovation_events CASCADE;
DROP TABLE IF EXISTS public.pitch_sessions CASCADE;
DROP TABLE IF EXISTS public.collaboration_requests CASCADE;
DROP TABLE IF EXISTS public.startup_likes CASCADE;
DROP TABLE IF EXISTS public.startup_bookmarks CASCADE;
DROP TABLE IF EXISTS public.startup_messages CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.showcase_ventures CASCADE;
DROP TABLE IF EXISTS public.showcase_investors CASCADE;
DROP TABLE IF EXISTS public.mentor_profiles CASCADE;
DROP TABLE IF EXISTS public.startups CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Drop functions tied to old domain
DROP FUNCTION IF EXISTS public.notify_on_like() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_bookmark() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_message() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_view() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_collab_request() CASCADE;
DROP FUNCTION IF EXISTS public.can_view_pitch_deck(text) CASCADE;

-- Remove mentor role assignments
DELETE FROM public.user_roles WHERE role = 'mentor';

-- Rebuild app_role enum without mentor
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin','founder','investor','ngo');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role
  USING role::text::public.app_role;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role_old) CASCADE;
DROP TYPE public.app_role_old;

-- Recreate has_role for new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Migrate existing 'founder' role assignments to 'ngo'
UPDATE public.user_roles SET role = 'ngo' WHERE role = 'founder';

-- Drop old role assignment trigger and replace
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requested_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';
  IF requested_role IN ('ngo','investor') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =========================================================
-- 2. ENUMS
-- =========================================================
CREATE TYPE public.org_stage AS ENUM ('idea','early','established','scaling','mature');
CREATE TYPE public.doc_visibility AS ENUM ('protected','confidential');
CREATE TYPE public.connection_status AS ENUM ('pending','accepted','declined');
CREATE TYPE public.connection_direction AS ENUM ('ngo_to_investor','investor_to_ngo');
CREATE TYPE public.investor_type AS ENUM ('individual','foundation','grant_maker','development_partner','corporate','impact_fund');

-- =========================================================
-- 3. ORGANIZATIONS
-- =========================================================
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  mission text,
  short_description text,
  sector text,
  country text,
  province text,
  funding_required numeric,
  currency text DEFAULT 'ZMW',
  target_beneficiaries text,
  beneficiary_type text,
  impact_area text,
  sdgs integer[] DEFAULT '{}',
  stage public.org_stage DEFAULT 'idea',
  founded_year integer,
  website text,
  email text,
  phone text,
  is_published boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  readiness_score integer,
  funding_probability integer,
  ai_strengths text[] DEFAULT '{}',
  ai_weaknesses text[] DEFAULT '{}',
  ai_suggestions text[] DEFAULT '{}',
  ai_last_analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published orgs are public" ON public.organizations FOR SELECT USING (is_published = true OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners insert" ON public.organizations FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update" ON public.organizations FOR UPDATE USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete" ON public.organizations FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 4. CONNECTION REQUESTS
-- =========================================================
CREATE TABLE public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction public.connection_direction NOT NULL,
  message text,
  status public.connection_status NOT NULL DEFAULT 'pending',
  due_diligence_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view" ON public.connection_requests FOR SELECT USING (initiator_id = auth.uid() OR recipient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Initiator creates" ON public.connection_requests FOR INSERT WITH CHECK (initiator_id = auth.uid());
CREATE POLICY "Recipient updates status" ON public.connection_requests FOR UPDATE USING (recipient_id = auth.uid() OR initiator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Participants delete" ON public.connection_requests FOR DELETE USING (initiator_id = auth.uid() OR recipient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER connection_requests_updated_at BEFORE UPDATE ON public.connection_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: has the viewer been accepted on a connection for this org?
CREATE OR REPLACE FUNCTION public.has_accepted_connection(_org_id uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE organization_id = _org_id
      AND status = 'accepted'
      AND (initiator_id = _viewer OR recipient_id = _viewer)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_due_diligence(_org_id uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE organization_id = _org_id
      AND status = 'accepted'
      AND due_diligence_granted = true
      AND (initiator_id = _viewer OR recipient_id = _viewer)
  );
$$;

-- =========================================================
-- 5. ORGANIZATION DOCUMENTS
-- =========================================================
CREATE TABLE public.organization_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  doc_type text,
  storage_path text NOT NULL,
  visibility public.doc_visibility NOT NULL DEFAULT 'protected',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_documents TO authenticated;
GRANT ALL ON public.organization_documents TO service_role;
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View per visibility" ON public.organization_documents FOR SELECT USING (
  uploader_id = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR (visibility = 'protected' AND public.has_accepted_connection(organization_id, auth.uid()))
  OR (visibility = 'confidential' AND public.has_due_diligence(organization_id, auth.uid()))
);
CREATE POLICY "Owner uploads" ON public.organization_documents FOR INSERT WITH CHECK (
  uploader_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND owner_id = auth.uid())
);
CREATE POLICY "Owner updates" ON public.organization_documents FOR UPDATE USING (uploader_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner deletes" ON public.organization_documents FOR DELETE USING (uploader_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 6. ENGAGEMENT TABLES (likes, bookmarks, messages, views)
-- =========================================================
CREATE TABLE public.org_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.org_likes TO authenticated;
GRANT ALL ON public.org_likes TO service_role;
ALTER TABLE public.org_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View likes" ON public.org_likes FOR SELECT USING (true);
CREATE POLICY "Like as self" ON public.org_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike own" ON public.org_likes FOR DELETE USING (user_id = auth.uid());

CREATE TABLE public.org_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.org_bookmarks TO authenticated;
GRANT ALL ON public.org_bookmarks TO service_role;
ALTER TABLE public.org_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views bookmarks" ON public.org_bookmarks FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid()));
CREATE POLICY "Bookmark as self" ON public.org_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unbookmark own" ON public.org_bookmarks FOR DELETE USING (user_id = auth.uid());

CREATE TABLE public.org_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_messages TO authenticated;
GRANT ALL ON public.org_messages TO service_role;
ALTER TABLE public.org_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view msgs" ON public.org_messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Send as self" ON public.org_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipient marks read" ON public.org_messages FOR UPDATE USING (recipient_id = auth.uid());

CREATE TABLE public.org_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.org_profile_views TO authenticated;
GRANT ALL ON public.org_profile_views TO service_role;
ALTER TABLE public.org_profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner sees views" ON public.org_profile_views FOR SELECT USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone records view" ON public.org_profile_views FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- =========================================================
-- 7. INVESTOR PROFILE EXTENSIONS
-- =========================================================
ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS investor_type public.investor_type,
  ADD COLUMN IF NOT EXISTS preferred_sdgs integer[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_beneficiaries text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_countries text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Make investor profiles publicly readable
DROP POLICY IF EXISTS "Investors public read" ON public.investor_profiles;
CREATE POLICY "Investors public read" ON public.investor_profiles FOR SELECT USING (true);
GRANT SELECT ON public.investor_profiles TO anon;

-- =========================================================
-- 8. NOTIFICATIONS (rebuilt)
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "System inserts" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Mark own read" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());

-- =========================================================
-- 9. NOTIFICATION TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_org_like() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o uuid; n text;
BEGIN
  SELECT owner_id, name INTO o, n FROM public.organizations WHERE id = NEW.organization_id;
  IF o IS NOT NULL AND o <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
    VALUES (o, NEW.user_id, 'like', 'New like on ' || coalesce(n,'your organization'), 'An investor liked your organization.', '/organizations/' || NEW.organization_id, NEW.organization_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_org_like AFTER INSERT ON public.org_likes FOR EACH ROW EXECUTE FUNCTION public.notify_org_like();

CREATE OR REPLACE FUNCTION public.notify_org_bookmark() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o uuid; n text;
BEGIN
  SELECT owner_id, name INTO o, n FROM public.organizations WHERE id = NEW.organization_id;
  IF o IS NOT NULL AND o <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
    VALUES (o, NEW.user_id, 'bookmark', 'Saved by an investor', 'An investor saved ' || coalesce(n,'your organization') || '.', '/organizations/' || NEW.organization_id, NEW.organization_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_org_bookmark AFTER INSERT ON public.org_bookmarks FOR EACH ROW EXECUTE FUNCTION public.notify_org_bookmark();

CREATE OR REPLACE FUNCTION public.notify_org_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
  VALUES (NEW.recipient_id, NEW.sender_id, 'message', coalesce(NEW.subject,'New message'), left(NEW.body,200), '/dashboard', NEW.organization_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_org_message AFTER INSERT ON public.org_messages FOR EACH ROW EXECUTE FUNCTION public.notify_org_message();

CREATE OR REPLACE FUNCTION public.notify_org_view() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent boolean; sname text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.org_profile_views
    WHERE organization_id = NEW.organization_id AND viewer_id = NEW.viewer_id AND id <> NEW.id
      AND created_at > now() - interval '6 hours'
  ) INTO recent;
  IF recent THEN RETURN NEW; END IF;
  SELECT name INTO sname FROM public.organizations WHERE id = NEW.organization_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
  VALUES (NEW.owner_id, NEW.viewer_id, 'view', 'Profile viewed', 'Someone viewed ' || coalesce(sname,'your organization') || '.', '/organizations/' || NEW.organization_id, NEW.organization_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_org_view AFTER INSERT ON public.org_profile_views FOR EACH ROW EXECUTE FUNCTION public.notify_org_view();

CREATE OR REPLACE FUNCTION public.notify_connection_request() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE oname text;
BEGIN
  SELECT name INTO oname FROM public.organizations WHERE id = NEW.organization_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
  VALUES (NEW.recipient_id, NEW.initiator_id, 'connection_request', 'New connection request', coalesce(NEW.message, 'Someone wants to connect about ' || coalesce(oname,'an organization') || '.'), '/dashboard', NEW.organization_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_conn_request AFTER INSERT ON public.connection_requests FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

CREATE OR REPLACE FUNCTION public.notify_connection_response() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE oname text;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  SELECT name INTO oname FROM public.organizations WHERE id = NEW.organization_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, organization_id)
  VALUES (NEW.initiator_id, NEW.recipient_id, 'connection_' || NEW.status::text,
    CASE WHEN NEW.status = 'accepted' THEN 'Connection accepted' ELSE 'Connection declined' END,
    'Your request about ' || coalesce(oname,'an organization') || ' was ' || NEW.status::text || '.',
    '/dashboard', NEW.organization_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_conn_response AFTER UPDATE ON public.connection_requests FOR EACH ROW EXECUTE FUNCTION public.notify_connection_response();

-- =========================================================
-- 10. STORAGE BUCKETS handled via tool calls separately
-- =========================================================
