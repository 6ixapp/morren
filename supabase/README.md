# Supabase migrations

Run these in the **Supabase Dashboard → SQL Editor** (or via `supabase db push` if you use Supabase CLI). Run migrations in order (oldest first).

## 1. Fix: "relation \"profiles\" does not exist"

**File:** `migrations/20250126000000_create_profiles_and_trigger.sql`

- Creates `public.profiles`, RLS, and a trigger that syncs `auth.users` → `profiles` and `users`.
- Backfills existing auth users.

## 2. Fix: "column p.userid does not exist"

**File:** `migrations/20250126100000_profiles_add_userid_column.sql`

- Adds a `userid` column to `public.profiles` (mirrors `id`) so RLS policies that reference `p.userid` work.

## 3. Fix: "column p.role does not exist"

**File:** `migrations/20250126200000_profiles_add_role_column.sql`

- Adds a `role` column to `public.profiles`, backfills from auth metadata, and updates the signup trigger to set `role`.

**Steps:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Run in order: **1** → **2** → **3** (each migration file’s contents).

If your `public.users` table has different column names (e.g. `full_name` instead of `name`), edit the `INSERT INTO public.users` parts in the first migration before running.
