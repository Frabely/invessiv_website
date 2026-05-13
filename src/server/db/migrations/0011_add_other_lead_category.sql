INSERT INTO lead_categories (id, slug, label_key, sort_order)
VALUES (gen_random_uuid(), 'other', 'other', 70) ON CONFLICT (slug) DO NOTHING;
