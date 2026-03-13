-- Announcements table for admin-managed banners (homepage).
-- Run after 20250313000001_admin_rls_policies.sql (which enables RLS on announcements).

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Anonymous (public) can read active announcements for the homepage.
DROP POLICY IF EXISTS "Allow anon read active announcements" ON public.announcements;
CREATE POLICY "Allow anon read active announcements"
  ON public.announcements FOR SELECT
  TO anon
  USING (is_active = true);
