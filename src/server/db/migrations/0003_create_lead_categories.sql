CREATE TABLE IF NOT EXISTS lead_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL CHECK (BTRIM(slug) <> ''),
  label_key TEXT NOT NULL CHECK (BTRIM(label_key) <> ''),
  description TEXT CHECK (description IS NULL OR BTRIM(description) <> ''),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS lead_categories_slug_uidx
  ON lead_categories (slug);
--> statement-breakpoint
INSERT INTO lead_categories (slug, label_key, sort_order) VALUES
  ('coaches',                 'coaches',                 10),
  ('craftspeople',            'craftspeople',            20),
  ('local-service-providers', 'local-service-providers', 30),
  ('small-b2b-providers',     'small-b2b-providers',     40),
  ('consultants',             'consultants',             50),
  ('photographers',           'photographers',           60)
ON CONFLICT (slug) DO NOTHING;
