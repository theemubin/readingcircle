-- ============================================================
-- Migration: Add Campuses table
-- ============================================================

-- Helper: current user's role (re-defined here to ensure migration independence)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE TABLE IF NOT EXISTS public.campuses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Active RLS on campuses
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

-- Policies for campuses
CREATE POLICY "Anyone can view campuses" ON public.campuses FOR SELECT USING (true);
CREATE POLICY "Admins can manage campuses" ON public.campuses FOR ALL USING (
  public.current_user_role() = 'admin'
);

-- Update users table to reference campuses if needed (optional, loosely coupled for now)
-- ALTER TABLE public.users ADD CONSTRAINT fk_user_campus FOREIGN KEY (campus_id) REFERENCES public.campuses(id);

-- Add some seed data
INSERT INTO public.campuses (name, invite_code) VALUES 
('Main University', 'MAIN2026'),
('City College', 'CITY2026'),
('Tech Institute', 'TECH2026')
ON CONFLICT (invite_code) DO NOTHING;
