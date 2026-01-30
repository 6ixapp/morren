-- Fix: "column p.role does not exist"
-- RLS or triggers reference p.role on profiles. Add role and keep it in sync.

-- Add role to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'buyer';

-- Backfill role from auth.users metadata
DO $$
BEGIN
  UPDATE public.profiles p
  SET role = COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users u WHERE u.id = p.id),
    'buyer'
  )
  WHERE p.role IS NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Update trigger so new signups get role in profiles
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

  -- Insert into profiles (include role)
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', user_name),
    NEW.raw_user_meta_data->>'avatar_url',
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = now();

  -- Insert into users (app table)
  BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;
