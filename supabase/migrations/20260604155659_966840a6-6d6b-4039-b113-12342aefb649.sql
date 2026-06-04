
-- LIKES
CREATE TABLE public.startup_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.startup_likes TO authenticated;
GRANT ALL ON public.startup_likes TO service_role;
ALTER TABLE public.startup_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view likes" ON public.startup_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "User can like" ON public.startup_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can unlike own" ON public.startup_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- BOOKMARKS
CREATE TABLE public.startup_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (startup_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.startup_bookmarks TO authenticated;
GRANT ALL ON public.startup_bookmarks TO service_role;
ALTER TABLE public.startup_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User views own bookmarks" ON public.startup_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can bookmark" ON public.startup_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can remove own bookmark" ON public.startup_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
CREATE TABLE public.startup_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  subject text,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.startup_messages TO authenticated;
GRANT ALL ON public.startup_messages TO service_role;
ALTER TABLE public.startup_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sender or recipient view" ON public.startup_messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Sender can send" ON public.startup_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipient can mark read" ON public.startup_messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- PROFILE VIEWS (tracks views on a startup/founder profile)
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL,
  founder_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profile_views_founder_idx ON public.profile_views (founder_id, created_at DESC);
GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Founder sees views of their startups" ON public.profile_views FOR SELECT TO authenticated USING (auth.uid() = founder_id);
CREATE POLICY "Viewer can log own view" ON public.profile_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id AND auth.uid() <> founder_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  startup_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient_idx ON public.notifications (recipient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipient views own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
CREATE POLICY "Authenticated can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);
CREATE POLICY "Recipient can mark read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- TRIGGERS: auto-create notifications
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f uuid; n text;
BEGIN
  SELECT founder_id, name INTO f, n FROM public.startups WHERE id = NEW.startup_id;
  IF f IS NOT NULL AND f <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, startup_id)
    VALUES (f, NEW.user_id, 'like', 'New like on ' || coalesce(n,'your startup'), 'An investor liked your startup.', '/ventures/' || NEW.startup_id, NEW.startup_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.startup_likes FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_bookmark()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f uuid; n text;
BEGIN
  SELECT founder_id, name INTO f, n FROM public.startups WHERE id = NEW.startup_id;
  IF f IS NOT NULL AND f <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, startup_id)
    VALUES (f, NEW.user_id, 'bookmark', 'Saved by an investor', 'An investor bookmarked ' || coalesce(n,'your startup') || '.', '/ventures/' || NEW.startup_id, NEW.startup_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_bookmark AFTER INSERT ON public.startup_bookmarks FOR EACH ROW EXECUTE FUNCTION public.notify_on_bookmark();

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, startup_id)
  VALUES (NEW.recipient_id, NEW.sender_id, 'message', coalesce(NEW.subject, 'New message'), left(NEW.body, 200), '/dashboard', NEW.startup_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.startup_messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_view()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent boolean; sname text;
BEGIN
  -- Throttle: skip if same viewer viewed same startup in last 6 hours
  SELECT EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE startup_id = NEW.startup_id AND viewer_id = NEW.viewer_id AND id <> NEW.id
      AND created_at > now() - interval '6 hours'
  ) INTO recent;
  IF recent THEN RETURN NEW; END IF;
  SELECT name INTO sname FROM public.startups WHERE id = NEW.startup_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, startup_id)
  VALUES (NEW.founder_id, NEW.viewer_id, 'view', 'Profile viewed', 'Someone viewed ' || coalesce(sname,'your startup') || '.', '/ventures/' || NEW.startup_id, NEW.startup_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_view AFTER INSERT ON public.profile_views FOR EACH ROW EXECUTE FUNCTION public.notify_on_view();

CREATE OR REPLACE FUNCTION public.notify_on_collab_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sname text;
BEGIN
  SELECT name INTO sname FROM public.startups WHERE id = NEW.startup_id;
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, body, link, startup_id)
  VALUES (NEW.founder_id, NEW.requester_id, 'collab_request', 'New collaboration request', 'New ' || replace(NEW.request_type::text,'_',' ') || ' request on ' || coalesce(sname,'your startup') || '.', '/dashboard', NEW.startup_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_collab AFTER INSERT ON public.collaboration_requests FOR EACH ROW EXECUTE FUNCTION public.notify_on_collab_request();
