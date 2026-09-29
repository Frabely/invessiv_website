-- Page list for the area picker of feedback items. The default is a deliberate exception: inserts of the
-- previous app version must keep working during the deploy window. Element length is checked by the app.
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS feedback_areas TEXT[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE projects
    ADD CONSTRAINT projects_feedback_areas_check CHECK (cardinality(feedback_areas) <= 30);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS feedback_rounds
(
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    round_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    preview_url TEXT,
    handover_note TEXT,
    due_on DATE,
    area_options TEXT[] NOT NULL,
    handed_over_by_member_id UUID NOT NULL,
    handed_over_at TIMESTAMPTZ NOT NULL,
    draft_updated_at TIMESTAMPTZ,
    draft_updated_by_portal_membership_id UUID,
    submitted_at TIMESTAMPTZ,
    submitted_by_portal_membership_id UUID,
    customer_notice TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by_member_id UUID,
    approved_at TIMESTAMPTZ,
    approved_by_portal_membership_id UUID,
    read_at TIMESTAMPTZ,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feedback_rounds_project_customer_fk FOREIGN KEY (project_id, customer_id)
        REFERENCES projects (id, customer_id) ON DELETE CASCADE,
    CONSTRAINT feedback_rounds_handed_over_by_fk FOREIGN KEY (handed_over_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT feedback_rounds_draft_updated_by_fk FOREIGN KEY (draft_updated_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT feedback_rounds_submitted_by_fk FOREIGN KEY (submitted_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT feedback_rounds_completed_by_fk FOREIGN KEY (completed_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT feedback_rounds_approved_by_fk FOREIGN KEY (approved_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT feedback_rounds_id_project_uidx UNIQUE (id, project_id),
    CONSTRAINT feedback_rounds_project_number_uidx UNIQUE (project_id, round_number),
    CONSTRAINT feedback_rounds_round_number_check CHECK (round_number BETWEEN 1 AND 20),
    CONSTRAINT feedback_rounds_status_check CHECK (
        status IN ('open', 'submitted', 'in_discussion', 'in_progress', 'completed', 'approved')
    ),
    CONSTRAINT feedback_rounds_preview_url_check CHECK (preview_url LIKE 'https://%' AND length(preview_url) <= 2048),
    CONSTRAINT feedback_rounds_handover_note_check CHECK (length(handover_note) <= 2000),
    CONSTRAINT feedback_rounds_area_options_check CHECK (cardinality(area_options) <= 30),
    CONSTRAINT feedback_rounds_customer_notice_check CHECK (length(customer_notice) <= 2000),
    CONSTRAINT feedback_rounds_version_check CHECK (version > 0),
    CONSTRAINT feedback_rounds_open_unsubmitted_check CHECK (
        status <> 'open' OR (submitted_at IS NULL AND submitted_by_portal_membership_id IS NULL)
    ),
    CONSTRAINT feedback_rounds_submitted_check CHECK (
        status NOT IN ('submitted', 'in_discussion', 'in_progress', 'completed') OR submitted_at IS NOT NULL
    ),
    -- The membership may vanish through SET NULL; the timestamp stays.
    CONSTRAINT feedback_rounds_submitted_by_check CHECK (
        submitted_by_portal_membership_id IS NULL OR submitted_at IS NOT NULL
    ),
    CONSTRAINT feedback_rounds_started_check CHECK (status <> 'in_progress' OR started_at IS NOT NULL),
    CONSTRAINT feedback_rounds_completed_check CHECK (
        status <> 'completed' OR (completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL)
    ),
    CONSTRAINT feedback_rounds_completed_at_check CHECK (
        completed_at IS NULL OR status IN ('completed', 'approved')
    ),
    CONSTRAINT feedback_rounds_approved_check CHECK ((status = 'approved') = (approved_at IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_rounds_active_uidx ON feedback_rounds (project_id)
    WHERE status IN ('open', 'submitted', 'in_discussion', 'in_progress');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_rounds_approved_uidx ON feedback_rounds (project_id)
    WHERE status = 'approved';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS feedback_rounds_queue_idx ON feedback_rounds (status, submitted_at)
    WHERE status IN ('submitted', 'in_discussion', 'in_progress');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS feedback_rounds_unread_idx ON feedback_rounds (project_id)
    WHERE status = 'submitted' AND read_at IS NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS feedback_round_items
(
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL,
    position INTEGER NOT NULL,
    area_label TEXT,
    kind TEXT,
    body TEXT NOT NULL,
    created_by_portal_membership_id UUID,
    result TEXT,
    result_note TEXT,
    result_set_by_member_id UUID,
    result_set_at TIMESTAMPTZ,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT feedback_round_items_round_fk FOREIGN KEY (round_id)
        REFERENCES feedback_rounds (id) ON DELETE CASCADE,
    CONSTRAINT feedback_round_items_created_by_fk FOREIGN KEY (created_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT feedback_round_items_result_set_by_fk FOREIGN KEY (result_set_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT feedback_round_items_id_round_uidx UNIQUE (id, round_id),
    -- Deferrable so a reorder of draft items can swap positions inside one transaction.
    CONSTRAINT feedback_round_items_round_position_uidx UNIQUE (round_id, position) DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT feedback_round_items_position_check CHECK (position >= 0 AND position < 30),
    CONSTRAINT feedback_round_items_area_label_check CHECK (
        area_label IS NULL OR (btrim(area_label) <> '' AND length(area_label) <= 80)
    ),
    CONSTRAINT feedback_round_items_kind_check CHECK (kind IN ('change_request', 'bug')),
    CONSTRAINT feedback_round_items_body_check CHECK (length(body) <= 5000),
    CONSTRAINT feedback_round_items_result_check CHECK (
        result IN ('implemented', 'not_implemented', 'additional_service')
    ),
    CONSTRAINT feedback_round_items_result_note_length_check CHECK (length(result_note) <= 2000),
    CONSTRAINT feedback_round_items_version_check CHECK (version > 0),
    CONSTRAINT feedback_round_items_result_fields_check CHECK (
        num_nonnulls(result, result_set_by_member_id, result_set_at) IN (0, 3)
    ),
    CONSTRAINT feedback_round_items_result_note_check CHECK (result_note IS NULL OR result IS NOT NULL),
    CONSTRAINT feedback_round_items_result_reply_check CHECK (
        result IS NULL
            OR result NOT IN ('not_implemented', 'additional_service')
            OR btrim(coalesce(result_note, '')) <> ''
    )
);
--> statement-breakpoint
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS feedback_item_id UUID;
--> statement-breakpoint
-- No cascade: rounds and items only disappear through the customer purge, which removes files first.
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_feedback_round_project_fk FOREIGN KEY (feedback_round_id, project_id)
        REFERENCES feedback_rounds (id, project_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_feedback_item_round_fk FOREIGN KEY (feedback_item_id, feedback_round_id)
        REFERENCES feedback_round_items (id, round_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_feedback_scope_check CHECK ((feedback_round_id IS NULL) = (feedback_item_id IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
-- A composite key with a NULL project matches nothing under MATCH SIMPLE, so the project is required here.
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_feedback_project_check CHECK (feedback_round_id IS NULL OR project_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_feedback_origin_check CHECK (
        feedback_round_id IS NULL OR (uploaded_by_side = 'customer' AND status = 'ready')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS files_feedback_item_idx ON files (feedback_item_id) WHERE feedback_item_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS feedback_round_id UUID;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE tasks
    ADD CONSTRAINT tasks_feedback_round_project_fk FOREIGN KEY (feedback_round_id, project_id)
        REFERENCES feedback_rounds (id, project_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE tasks
    ADD CONSTRAINT tasks_feedback_round_side_check CHECK (feedback_round_id IS NULL OR action_side = 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS tasks_feedback_round_uidx ON tasks (feedback_round_id)
    WHERE feedback_round_id IS NOT NULL;
