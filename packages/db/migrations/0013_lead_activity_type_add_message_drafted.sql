DO
$$
BEGIN
  IF
EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'lead_activity_type'
  ) THEN
ALTER TYPE "lead_activity_type" ADD VALUE IF NOT EXISTS 'message_drafted';
END IF;
END $$;
--> statement-breakpoint

-- Refresh the check constraint to include 'message_drafted'
ALTER TABLE "lead_activities" DROP CONSTRAINT IF EXISTS "lead_activities_type_check";
--> statement-breakpoint

ALTER TABLE "lead_activities"
    ADD CONSTRAINT "lead_activities_type_check"
        CHECK ("type" IN ('note', 'status_change', 'inbound_submission', 'import', 'bulk_edit', 'message_drafted'));
