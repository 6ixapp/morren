-- Fix: "relation \"profiles\" does not exist"
-- Many Supabase projects use a trigger or RLS that references public.profiles.
-- This migration creates the profiles table and a trigger that syncs auth.users
-- into both public.profiles and public.users (used by this app).

-- 1. Create profiles table (expected by Supabase Auth triggers / RLS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Optional: RLS so users can read/update own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Trigger: on new auth user, insert into profiles and users
-- (Only insert into users if the table has the expected columns; adjust if your schema differs.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name text;
  user_role text;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');

  -- Insert into profiles (fixes "relation profiles does not exist")
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', user_name),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  -- Insert into users (app table) so the app finds the user
  -- Wrapped so trigger still succeeds if users table has different columns
  BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- ignore (e.g. different column names); app can upsert via AuthContext
  END;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (might point to old function that only inserted into profiles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: ensure existing auth users have a row in profiles (and users if missing)
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Ensure existing auth users have a row in users (app table)
DO $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1), 'User'),
    COALESCE(raw_user_meta_data->>'role', 'buyer')
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if users table has different structure
END $$;
