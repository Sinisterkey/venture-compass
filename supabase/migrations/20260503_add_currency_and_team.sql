-- Create currency enum type
CREATE TYPE public.currency_type AS ENUM ('ZMK', 'USD', 'EUR', 'GBP', 'ZAR');

-- Add currency and team_members to startups table
ALTER TABLE public.startups
  ADD COLUMN currency public.currency_type DEFAULT 'ZMK',
  ADD COLUMN team_members jsonb DEFAULT '[]'::jsonb;

-- Add currency to investor_profiles table
ALTER TABLE public.investor_profiles
  ADD COLUMN currency public.currency_type DEFAULT 'ZMK';

-- Add comment for team_members structure
COMMENT ON COLUMN public.startups.team_members IS 'Array of team members: [{name, role, bio, image_url}]';
