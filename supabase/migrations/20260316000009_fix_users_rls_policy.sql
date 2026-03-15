-- Migration: Ensure authenticated users can always read their own profile row

-- Update the RLS policy on public.users to explicitly allow a user to select their own row.
-- This avoids edge cases where auth.uid() may be null or the `is_blocked` helper returns NULL.

-- Drop the existing policy (if it exists) and recreate it with the new logic.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can view non-blocked profiles'
      AND tablename = 'users'
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view non-blocked profiles" ON public.users';
  END IF;

  EXECUTE $cmd$
    CREATE POLICY "Users can view non-blocked profiles" ON public.users
      FOR SELECT USING (
        auth.uid() = id
        OR NOT public.is_blocked(auth.uid(), id)
      );
  $cmd$;
END;
$$;
