-- Add featured flag so admin can curate items for the home page
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN menu_items.featured IS 'When true, item appears in the home page featured section (top 6).';
