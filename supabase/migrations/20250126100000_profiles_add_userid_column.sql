-- Fix: "column p.userid does not exist"
-- Some RLS policies or triggers reference p.userid (camelCase). PostgreSQL lowercases
-- unquoted identifiers, so they look for "userid". Add a column that mirrors id.

-- Add userid to profiles so policies using p.userid work (e.g. auth.uid() = p.userid)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS userid uuid GENERATED ALWAYS AS (id) STORED;

-- If userid was already added as a plain column (e.g. by another migration), backfill it
DO $$
BEGIN
  UPDATE public.profiles SET userid = id WHERE userid IS NULL;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if userid is generated (cannot update) or column doesn't exist
END $$;
