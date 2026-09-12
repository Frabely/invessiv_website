CREATE TABLE IF NOT EXISTS activities
(
    id
    UUID
    PRIMARY
    KEY,
    lead_id
    UUID
    REFERENCES
    leads
(
    id
) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers
(
    id
)
  ON DELETE CASCADE,
    project_id UUID,
    type TEXT NOT NULL CHECK
(
    type
    IN
(
    'note',
    'status_change',
    'inbound_submission',
    'import',
    'bulk_edit',
    'message_drafted',
    'created',
    'field_change',
    'converted_from_lead',
    'credential_revealed',
    'file_uploaded',
    'submission_received',
    'phase_change',
    'renewal_renewed',
    'mail_sent'
)
    ),
    title TEXT,
    body TEXT,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL,
    actor_type TEXT NOT NULL CHECK
(
    actor_type
    IN
(
    'system',
    'user',
    'customer'
)),
    actor_id TEXT,
    actor_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT activities_subject_check CHECK
(
    lead_id
    IS
    NOT
    NULL
    OR
    customer_id
    IS
    NOT
    NULL
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activities_customer_id_occurred_at_idx
    ON activities (customer_id, occurred_at DESC, id DESC)
    WHERE customer_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activities_lead_id_occurred_at_idx
    ON activities (lead_id, occurred_at DESC, id DESC)
    WHERE lead_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activities_project_id_occurred_at_idx
    ON activities (project_id, occurred_at DESC, id DESC)
    WHERE project_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS activities_type_occurred_at_idx
    ON activities (type, occurred_at);
--> statement-breakpoint
INSERT INTO activities (id,
                        lead_id,
                        customer_id,
                        project_id,
                        type,
                        title,
                        body,
                        metadata,
                        occurred_at,
                        actor_type,
                        actor_id,
                        actor_label,
                        created_at)
SELECT id,
       lead_id,
       NULL,
       NULL,
       type,
       title,
       body,
       metadata,
       occurred_at,
       actor_type,
       actor_id,
       actor_label,
       created_at
FROM lead_activities ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
DO
$$
BEGIN
  IF
EXISTS (
    SELECT
      legacy.id
    FROM lead_activities AS legacy
    LEFT JOIN activities AS migrated ON migrated.id = legacy.id
    WHERE migrated.id IS NULL
      OR migrated.lead_id IS DISTINCT FROM legacy.lead_id
      OR migrated.type IS DISTINCT FROM legacy.type
      OR migrated.occurred_at IS DISTINCT FROM legacy.occurred_at
  ) THEN
    RAISE EXCEPTION 'Activity backfill verification failed';
END IF;
END
$$;
