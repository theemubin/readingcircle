-- Migration: create user profile in public.users whenever a new auth user is created

-- Ensure the user_role type exists. Some PostgreSQL versions (including older ones
-- used by Supabase) do not support CREATE TYPE IF NOT EXISTS, so we check first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'campus_poc', 'admin');
  END IF;
END;
$$;

-- Ensure the public.users table exists. This is needed for the REST endpoint (/rest/v1/users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'users'
  ) THEN
    CREATE TABLE public.users (
      id           uuid primary key,
      role         public.user_role not null default 'student',
      campus_id    uuid,
      display_name text not null default 'Reader',
      username     text not null unique,
      bio          text,
      avatar_url   text,
      created_at   timestamptz not null default now(),
      updated_at   timestamptz not null default now()
    );
  END IF;
END;
$$;

-- Create helper function to insert a user profile row when a new auth user is created.
-- This ensures the app always has a corresponding row in public.users for auth users.

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
as $$
begin
  -- Skip if a profile already exists
  insert into public.users (id, display_name, username)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'full_name')::text, new.email::text, 'Reader'),
    coalesce(split_part(new.email, '@', 1), new.id::text)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger on auth.users insert.
-- Guard against re-creation if it already exists (prevents migration failures).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'users'
      AND t.tgname = 'create_profile_after_auth_user_insert'
  ) THEN
    CREATE TRIGGER create_profile_after_auth_user_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_profile_for_auth_user();
  END IF;
END;
$$;
