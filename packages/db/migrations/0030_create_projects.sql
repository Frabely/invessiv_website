CREATE TABLE IF NOT EXISTS projects
(
    id
    UUID
    PRIMARY
    KEY,
    customer_id
    UUID
    NOT
    NULL
    REFERENCES
    customers
(
    id
) ON DELETE CASCADE,
    owner_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
),
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    phase TEXT NOT NULL,
    process_steps TEXT[] NOT NULL,
    current_process_step TEXT NOT NULL,
    workflow_key TEXT NOT NULL,
    billing_model TEXT NOT NULL,
    included_feedback_rounds INTEGER NOT NULL,
    preview_url TEXT,
    next_step_label TEXT,
    next_step_due_on DATE,
    started_on DATE,
    budget_cents INTEGER,
    hourly_rate_cents INTEGER,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT projects_title_check CHECK
(
    btrim
(
    title
) <> ''),
    CONSTRAINT projects_status_check CHECK
(
    status
    IN
(
    'planned',
    'active',
    'paused',
    'completed',
    'cancelled',
    'archived'
)
    ),
    CONSTRAINT projects_phase_check CHECK
(
    phase
    IN
(
    'onboarding',
    'design',
    'development',
    'feedback',
    'launch',
    'maintenance'
)
    ),
    CONSTRAINT projects_process_steps_check CHECK
(
    cardinality
(
    process_steps
) > 0
    AND current_process_step = ANY
(
    process_steps
)
    ),
    CONSTRAINT projects_workflow_check CHECK
(
    workflow_key
    IN
(
    'standard_web_v1'
)),
    CONSTRAINT projects_billing_model_check CHECK
(
    billing_model
    IN
(
    'fixed_price',
    'hourly',
    'retainer',
    'internal'
)
    ),
    CONSTRAINT projects_feedback_rounds_check CHECK
(
    included_feedback_rounds
    BETWEEN
    1
    AND
    20
),
    CONSTRAINT projects_budget_cents_check CHECK
(
    budget_cents
    IS
    NULL
    OR
    budget_cents
    >=
    0
),
    CONSTRAINT projects_hourly_rate_cents_check CHECK
(
    hourly_rate_cents
    IS
    NULL
    OR
    hourly_rate_cents
    >=
    0
),
    CONSTRAINT projects_version_check CHECK
(
    version >
    0
)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS projects_id_customer_uidx ON projects (id, customer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS projects_customer_created_at_idx ON projects (customer_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS projects_open_owner_idx ON projects (owner_member_id)
    WHERE status NOT IN ('completed', 'cancelled', 'archived');
--> statement-breakpoint
DO
$$
BEGIN
  IF
NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activities_project_id_projects_id_fk'
  ) THEN
ALTER TABLE activities
    ADD CONSTRAINT activities_project_id_projects_id_fk
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL;
END IF;
END $$;
