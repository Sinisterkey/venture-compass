
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('founder', 'investor', 'mentor', 'university', 'admin');
CREATE TYPE public.founder_type AS ENUM ('student', 'independent');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'more_info_needed');
CREATE TYPE public.funding_stage AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b_plus');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  website TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Startups table
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  problem_statement TEXT,
  solution TEXT,
  target_market TEXT,
  industry TEXT,
  business_model TEXT,
  funding_stage funding_stage,
  funding_requested NUMERIC,
  pitch_deck_url TEXT,
  demo_video_url TEXT,
  website TEXT,
  is_university_project BOOLEAN DEFAULT false,
  university_name TEXT,
  is_published BOOLEAN DEFAULT false,
  verification_status verification_status DEFAULT 'pending',
  pitch_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published startups viewable by everyone" ON public.startups FOR SELECT USING (is_published = true);
CREATE POLICY "Founders can view own startups" ON public.startups FOR SELECT USING (auth.uid() = founder_id);
CREATE POLICY "Founders can insert own startups" ON public.startups FOR INSERT WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founders can update own startups" ON public.startups FOR UPDATE USING (auth.uid() = founder_id);
CREATE POLICY "Admins can view all startups" ON public.startups FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all startups" ON public.startups FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON public.startups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verification requests
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_type founder_type NOT NULL,
  university_name TEXT,
  student_id_url TEXT,
  selfie_url TEXT,
  government_id_url TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own verifications" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all verifications" ON public.verification_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update verifications" ON public.verification_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Investor profiles
CREATE TABLE public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_type TEXT,
  investment_focus TEXT[],
  min_investment NUMERIC,
  max_investment NUMERIC,
  preferred_stages funding_stage[],
  portfolio_companies TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investor profiles viewable by authenticated" ON public.investor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own investor profile" ON public.investor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investor profile" ON public.investor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_investor_profiles_updated_at BEFORE UPDATE ON public.investor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mentor profiles
CREATE TABLE public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise TEXT[],
  industries TEXT[],
  availability TEXT,
  max_mentees INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentor profiles viewable by authenticated" ON public.mentor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own mentor profile" ON public.mentor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mentor profile" ON public.mentor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON public.mentor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('pitch-decks', 'pitch-decks', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('startup-media', 'startup-media', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own pitch decks" ON storage.objects FOR SELECT USING (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own pitch decks" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pitch-decks' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own verification docs" ON storage.objects FOR SELECT USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own verification docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Startup media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'startup-media');
CREATE POLICY "Users can upload startup media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'startup-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view verification docs" ON storage.objects FOR SELECT USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));
