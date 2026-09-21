ALTER TABLE project_line_items
    ADD COLUMN IF NOT EXISTS status TEXT;
--> statement-breakpoint

UPDATE project_line_items
SET status = 'confirmed'
WHERE status IS NULL;
--> statement-breakpoint

ALTER TABLE project_line_items
    ADD CONSTRAINT project_line_items_status_check
        CHECK (status IN ('requested', 'approved', 'planned', 'confirmed', 'rejected'));
