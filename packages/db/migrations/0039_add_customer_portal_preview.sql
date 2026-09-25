-- Ordner 12b (Task 20): stores the one-time confirmation made before a customer receives
-- their first portal invitation. Confirmation history remains available after access revocation.
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS portal_preview_confirmed_at TIMESTAMPTZ;
--> statement-breakpoint
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS portal_preview_confirmed_by_member_id UUID REFERENCES workspace_members (id) ON DELETE RESTRICT;
--> statement-breakpoint
DO
$$
BEGIN
    IF
NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customers_portal_preview_confirmation_check'
    ) THEN
ALTER TABLE customers
    ADD CONSTRAINT customers_portal_preview_confirmation_check CHECK (
        (portal_preview_confirmed_at IS NULL AND portal_preview_confirmed_by_member_id IS NULL)
            OR (portal_preview_confirmed_at IS NOT NULL AND portal_preview_confirmed_by_member_id IS NOT NULL)
        );
END IF;
END $$;
--> statement-breakpoint
-- Create the replacement before removing the full unique index. Revoked rows remain as history.
CREATE UNIQUE INDEX IF NOT EXISTS portal_memberships_active_customer_person_uidx
    ON portal_memberships (customer_id, person_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
-- The 0038 index prevents re-invitation after revocation and cannot be changed in place.
DROP INDEX IF EXISTS portal_memberships_customer_person_uidx;
