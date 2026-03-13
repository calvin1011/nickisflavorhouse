# Supabase migrations

Run these in the Supabase dashboard: **SQL Editor** → New query → paste the contents of the migration file → Run.

- `20250313000000_add_menu_items_available.sql` — Adds `available` to `menu_items` so the public menu can hide unavailable items and admin can toggle availability. Required if you see "column menu_items.available does not exist".

- `20250313000001_admin_rls_policies.sql` — RLS policies so anonymous users can read categories and menu_items (public menu), and authenticated users (admin) have full access to categories, menu_items, orders, order_items, and announcements. Run this if the admin panel cannot load or update data.

- `20250313000002_create_announcements.sql` — Creates `announcements` table (title, body, image_url, is_active) and allows anonymous read of active rows for the homepage. If the table does not exist yet, run this before `20250313000001_admin_rls_policies.sql`. Create a Storage bucket named `announcement-images` (public) in the Supabase dashboard for announcement images.

- `20250313000003_add_announcements_updated_at.sql` — Adds `updated_at` to `announcements` if missing. Run if you see "column announcements.updated_at does not exist".
