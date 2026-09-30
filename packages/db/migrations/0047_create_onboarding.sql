-- Onboarding building kit (plans/crm/15-onboarding/63-datenmodell-und-regeln.md). Catalog and forms share the
-- definition tables: a block with owner_form_id NULL is a catalog block, otherwise it belongs to exactly one form.
-- Rules across tables (same block and level for conditions, catalog-only template blocks, answers only on fields
-- of the same form) are enforced by the write path and covered by db:smoke:crm.
CREATE TABLE IF NOT EXISTS onboarding_templates
(
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_templates_title_check CHECK (btrim(title) <> '' AND length(title) <= 120),
    CONSTRAINT onboarding_templates_description_check CHECK (length(description) <= 1000),
    CONSTRAINT onboarding_templates_status_check CHECK (status IN ('active', 'archived')),
    CONSTRAINT onboarding_templates_version_check CHECK (version > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_forms
(
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    project_id UUID NOT NULL,
    source_template_id UUID,
    status TEXT NOT NULL,
    created_by_member_id UUID NOT NULL,
    released_at TIMESTAMPTZ,
    released_by_member_id UUID,
    submitted_at TIMESTAMPTZ,
    submitted_by_portal_membership_id UUID,
    services_confirmed_at TIMESTAMPTZ,
    services_confirmed_by_portal_membership_id UUID,
    services_note TEXT,
    call_held_on DATE,
    completed_at TIMESTAMPTZ,
    completed_by_member_id UUID,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_forms_project_customer_fk FOREIGN KEY (project_id, customer_id)
        REFERENCES projects (id, customer_id) ON DELETE CASCADE,
    CONSTRAINT onboarding_forms_source_template_fk FOREIGN KEY (source_template_id)
        REFERENCES onboarding_templates (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_forms_created_by_fk FOREIGN KEY (created_by_member_id) REFERENCES workspace_members (id),
    CONSTRAINT onboarding_forms_released_by_fk FOREIGN KEY (released_by_member_id) REFERENCES workspace_members (id),
    CONSTRAINT onboarding_forms_submitted_by_fk FOREIGN KEY (submitted_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_forms_services_confirmed_by_fk FOREIGN KEY (services_confirmed_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_forms_completed_by_fk FOREIGN KEY (completed_by_member_id) REFERENCES workspace_members (id),
    CONSTRAINT onboarding_forms_project_uidx UNIQUE (project_id),
    CONSTRAINT onboarding_forms_id_customer_uidx UNIQUE (id, customer_id),
    CONSTRAINT onboarding_forms_id_project_uidx UNIQUE (id, project_id),
    CONSTRAINT onboarding_forms_status_check CHECK (
        status IN ('draft', 'open', 'submitted', 'changes_requested', 'completed')
    ),
    CONSTRAINT onboarding_forms_services_note_check CHECK (length(services_note) <= 2000),
    CONSTRAINT onboarding_forms_version_check CHECK (version > 0),
    CONSTRAINT onboarding_forms_released_check CHECK ((status = 'draft') = (released_at IS NULL)),
    CONSTRAINT onboarding_forms_released_by_check CHECK (released_at IS NULL OR released_by_member_id IS NOT NULL),
    CONSTRAINT onboarding_forms_submitted_check CHECK (
        status NOT IN ('submitted', 'changes_requested', 'completed') OR submitted_at IS NOT NULL
    ),
    CONSTRAINT onboarding_forms_completed_check CHECK (
        (status = 'completed') = (
            completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL AND call_held_on IS NOT NULL
        )
    ),
    -- The membership may vanish through SET NULL; the timestamp stays.
    CONSTRAINT onboarding_forms_services_confirmed_check CHECK (
        services_confirmed_by_portal_membership_id IS NULL OR services_confirmed_at IS NOT NULL
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_forms_customer_idx ON onboarding_forms (customer_id, completed_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_blocks
(
    id UUID PRIMARY KEY,
    owner_form_id UUID,
    source_block_id UUID,
    key TEXT NOT NULL,
    carry_over BOOLEAN NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_blocks_owner_form_fk FOREIGN KEY (owner_form_id)
        REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_blocks_source_block_fk FOREIGN KEY (source_block_id)
        REFERENCES onboarding_blocks (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_blocks_id_owner_uidx UNIQUE (id, owner_form_id),
    CONSTRAINT onboarding_blocks_key_check CHECK (key ~ '^[a-z][a-z0-9_]{1,62}$'),
    CONSTRAINT onboarding_blocks_status_check CHECK (status IN ('active', 'archived')),
    CONSTRAINT onboarding_blocks_version_check CHECK (version > 0),
    -- Blocks of a form are removed, never archived.
    CONSTRAINT onboarding_blocks_owner_status_check CHECK (owner_form_id IS NULL OR status = 'active'),
    CONSTRAINT onboarding_blocks_catalog_source_check CHECK (owner_form_id IS NOT NULL OR source_block_id IS NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_blocks_catalog_key_uidx ON onboarding_blocks (key)
    WHERE owner_form_id IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_blocks_owner_idx ON onboarding_blocks (owner_form_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_blocks_source_idx ON onboarding_blocks (source_block_id)
    WHERE source_block_id IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_block_translations
(
    block_id UUID NOT NULL,
    locale TEXT NOT NULL,
    title TEXT NOT NULL,
    intro TEXT,
    CONSTRAINT onboarding_block_translations_pkey PRIMARY KEY (block_id, locale),
    CONSTRAINT onboarding_block_translations_block_fk FOREIGN KEY (block_id)
        REFERENCES onboarding_blocks (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_block_translations_locale_check CHECK (locale IN ('de', 'en')),
    CONSTRAINT onboarding_block_translations_title_check CHECK (btrim(title) <> '' AND length(title) <= 120),
    CONSTRAINT onboarding_block_translations_intro_check CHECK (length(intro) <= 2000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_fields
(
    id UUID PRIMARY KEY,
    block_id UUID NOT NULL,
    parent_field_id UUID,
    key TEXT NOT NULL,
    position INTEGER NOT NULL,
    type TEXT NOT NULL,
    requirement TEXT NOT NULL,
    max_length INTEGER,
    min_items INTEGER,
    max_items INTEGER,
    accepted_asset_kinds TEXT[],
    prefill_source TEXT,
    condition_field_id UUID,
    condition_choice_id UUID,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_fields_block_fk FOREIGN KEY (block_id) REFERENCES onboarding_blocks (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_fields_parent_fk FOREIGN KEY (parent_field_id)
        REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_fields_block_key_uidx UNIQUE (block_id, key),
    -- Deferrable so a reorder can swap positions inside one transaction.
    CONSTRAINT onboarding_fields_position_uidx UNIQUE NULLS NOT DISTINCT (block_id, parent_field_id, position)
        DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT onboarding_fields_key_check CHECK (key ~ '^[a-z][a-z0-9_]{1,62}$'),
    CONSTRAINT onboarding_fields_position_check CHECK (position >= 0 AND position < 100),
    CONSTRAINT onboarding_fields_type_check CHECK (
        type IN ('short_text', 'long_text', 'email', 'phone', 'url', 'choice', 'multi_choice', 'yes_no', 'scale',
                 'color', 'files', 'confirmation', 'group', 'project_services')
    ),
    CONSTRAINT onboarding_fields_requirement_check CHECK (requirement IN ('required', 'optional')),
    CONSTRAINT onboarding_fields_max_length_check CHECK (max_length BETWEEN 1 AND 20000),
    CONSTRAINT onboarding_fields_min_items_check CHECK (min_items BETWEEN 0 AND 100),
    CONSTRAINT onboarding_fields_max_items_check CHECK (max_items BETWEEN 1 AND 100),
    CONSTRAINT onboarding_fields_prefill_source_check CHECK (
        prefill_source IN ('customer_company_name', 'customer_address', 'customer_vat_id', 'customer_website_url',
                           'primary_contact_name', 'primary_contact_email', 'primary_contact_phone')
    ),
    CONSTRAINT onboarding_fields_version_check CHECK (version > 0),
    CONSTRAINT onboarding_fields_condition_pair_check CHECK ((condition_field_id IS NULL) = (condition_choice_id IS NULL)),
    CONSTRAINT onboarding_fields_item_range_check CHECK (
        min_items IS NULL OR max_items IS NULL OR min_items <= max_items
    ),
    CONSTRAINT onboarding_fields_max_length_type_check CHECK (
        max_length IS NULL OR type IN ('short_text', 'long_text')
    ),
    CONSTRAINT onboarding_fields_item_count_type_check CHECK (
        (min_items IS NULL AND max_items IS NULL) OR type IN ('files', 'group', 'multi_choice')
    ),
    CONSTRAINT onboarding_fields_asset_kinds_type_check CHECK (accepted_asset_kinds IS NULL OR type = 'files'),
    CONSTRAINT onboarding_fields_parent_type_check CHECK (
        parent_field_id IS NULL OR type NOT IN ('group', 'project_services')
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_fields_block_idx ON onboarding_fields (block_id, position);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_field_translations
(
    field_id UUID NOT NULL,
    locale TEXT NOT NULL,
    label TEXT NOT NULL,
    help TEXT,
    CONSTRAINT onboarding_field_translations_pkey PRIMARY KEY (field_id, locale),
    CONSTRAINT onboarding_field_translations_field_fk FOREIGN KEY (field_id)
        REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_field_translations_locale_check CHECK (locale IN ('de', 'en')),
    CONSTRAINT onboarding_field_translations_label_check CHECK (btrim(label) <> '' AND length(label) <= 300),
    CONSTRAINT onboarding_field_translations_help_check CHECK (length(help) <= 2000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_field_choices
(
    id UUID PRIMARY KEY,
    field_id UUID NOT NULL,
    key TEXT NOT NULL,
    position INTEGER NOT NULL,
    version INTEGER NOT NULL,
    CONSTRAINT onboarding_field_choices_field_fk FOREIGN KEY (field_id)
        REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_field_choices_field_key_uidx UNIQUE (field_id, key),
    CONSTRAINT onboarding_field_choices_position_uidx UNIQUE (field_id, position) DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT onboarding_field_choices_id_field_uidx UNIQUE (id, field_id),
    CONSTRAINT onboarding_field_choices_key_check CHECK (key ~ '^[a-z][a-z0-9_]{0,62}$'),
    CONSTRAINT onboarding_field_choices_position_check CHECK (position >= 0 AND position < 50),
    CONSTRAINT onboarding_field_choices_version_check CHECK (version > 0)
);
--> statement-breakpoint
-- One composite key instead of two single ones: it binds the choice to the trigger field, and deleting the choice
-- (or the trigger field with its choices) clears both columns together, so the pair check never trips.
DO
$$
BEGIN
ALTER TABLE onboarding_fields
    ADD CONSTRAINT onboarding_fields_condition_choice_fk FOREIGN KEY (condition_choice_id, condition_field_id)
        REFERENCES onboarding_field_choices (id, field_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_choice_translations
(
    choice_id UUID NOT NULL,
    locale TEXT NOT NULL,
    label TEXT NOT NULL,
    CONSTRAINT onboarding_choice_translations_pkey PRIMARY KEY (choice_id, locale),
    CONSTRAINT onboarding_choice_translations_choice_fk FOREIGN KEY (choice_id)
        REFERENCES onboarding_field_choices (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_choice_translations_locale_check CHECK (locale IN ('de', 'en')),
    CONSTRAINT onboarding_choice_translations_label_check CHECK (btrim(label) <> '' AND length(label) <= 200)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_template_blocks
(
    template_id UUID NOT NULL,
    block_id UUID NOT NULL,
    position INTEGER NOT NULL,
    CONSTRAINT onboarding_template_blocks_pkey PRIMARY KEY (template_id, block_id),
    CONSTRAINT onboarding_template_blocks_template_fk FOREIGN KEY (template_id)
        REFERENCES onboarding_templates (id) ON DELETE CASCADE,
    -- A catalog block in use by a template cannot be deleted, only archived.
    CONSTRAINT onboarding_template_blocks_block_fk FOREIGN KEY (block_id)
        REFERENCES onboarding_blocks (id) ON DELETE RESTRICT,
    CONSTRAINT onboarding_template_blocks_position_uidx UNIQUE (template_id, position) DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT onboarding_template_blocks_position_check CHECK (position >= 0 AND position < 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_form_blocks
(
    form_id UUID NOT NULL,
    block_id UUID NOT NULL,
    position INTEGER NOT NULL,
    review_status TEXT NOT NULL,
    clarification_mode TEXT,
    review_note TEXT,
    reviewed_by_member_id UUID,
    reviewed_at TIMESTAMPTZ,
    version INTEGER NOT NULL,
    CONSTRAINT onboarding_form_blocks_pkey PRIMARY KEY (form_id, block_id),
    CONSTRAINT onboarding_form_blocks_form_fk FOREIGN KEY (form_id) REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    -- Binds the step to a block owned by the same form; a catalog block can never become a step.
    CONSTRAINT onboarding_form_blocks_block_owner_fk FOREIGN KEY (block_id, form_id)
        REFERENCES onboarding_blocks (id, owner_form_id) ON DELETE CASCADE,
    CONSTRAINT onboarding_form_blocks_reviewed_by_fk FOREIGN KEY (reviewed_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT onboarding_form_blocks_position_uidx UNIQUE (form_id, position) DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT onboarding_form_blocks_position_check CHECK (position >= 0 AND position < 100),
    CONSTRAINT onboarding_form_blocks_review_status_check CHECK (review_status IN ('pending', 'complete', 'clarification')),
    CONSTRAINT onboarding_form_blocks_clarification_mode_check CHECK (clarification_mode IN ('call', 'customer')),
    CONSTRAINT onboarding_form_blocks_review_note_check CHECK (length(review_note) <= 2000),
    CONSTRAINT onboarding_form_blocks_version_check CHECK (version > 0),
    CONSTRAINT onboarding_form_blocks_clarification_check CHECK (
        (review_status = 'clarification') = (clarification_mode IS NOT NULL)
    ),
    CONSTRAINT onboarding_form_blocks_reviewed_check CHECK (
        review_status = 'pending' OR (reviewed_by_member_id IS NOT NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT onboarding_form_blocks_clarification_note_check CHECK (
        clarification_mode IS NULL OR btrim(coalesce(review_note, '')) <> ''
    )
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_group_entries
(
    id UUID PRIMARY KEY,
    form_id UUID NOT NULL,
    field_id UUID NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_group_entries_form_fk FOREIGN KEY (form_id) REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_group_entries_field_fk FOREIGN KEY (field_id)
        REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_group_entries_position_uidx UNIQUE (field_id, position) DEFERRABLE INITIALLY IMMEDIATE,
    CONSTRAINT onboarding_group_entries_id_form_uidx UNIQUE (id, form_id),
    CONSTRAINT onboarding_group_entries_position_check CHECK (position >= 0 AND position < 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS onboarding_answers
(
    id UUID PRIMARY KEY,
    form_id UUID NOT NULL,
    field_id UUID NOT NULL,
    group_entry_id UUID,
    choice_id UUID,
    value TEXT,
    sort_order INTEGER NOT NULL,
    updated_by_portal_membership_id UUID,
    updated_by_member_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_answers_form_fk FOREIGN KEY (form_id) REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answers_field_fk FOREIGN KEY (field_id) REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answers_entry_form_fk FOREIGN KEY (group_entry_id, form_id)
        REFERENCES onboarding_group_entries (id, form_id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answers_choice_field_fk FOREIGN KEY (choice_id, field_id)
        REFERENCES onboarding_field_choices (id, field_id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answers_updated_by_portal_fk FOREIGN KEY (updated_by_portal_membership_id)
        REFERENCES portal_memberships (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_answers_updated_by_member_fk FOREIGN KEY (updated_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT onboarding_answers_slot_uidx UNIQUE NULLS NOT DISTINCT (field_id, group_entry_id, sort_order),
    CONSTRAINT onboarding_answers_value_check CHECK (
        value IS NULL OR (btrim(value) <> '' AND length(value) <= 20000)
    ),
    CONSTRAINT onboarding_answers_sort_order_check CHECK (sort_order >= 0 AND sort_order < 100),
    CONSTRAINT onboarding_answers_content_check CHECK (num_nonnulls(value, choice_id) = 1),
    CONSTRAINT onboarding_answers_updated_by_check CHECK (
        num_nonnulls(updated_by_portal_membership_id, updated_by_member_id) <= 1
    )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_answers_form_idx ON onboarding_answers (form_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_answers_choice_block_uidx
    ON onboarding_answers (field_id, choice_id)
    WHERE group_entry_id IS NULL AND choice_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_answers_choice_entry_uidx
    ON onboarding_answers (field_id, group_entry_id, choice_id)
    WHERE group_entry_id IS NOT NULL AND choice_id IS NOT NULL;
--> statement-breakpoint
-- A link table instead of columns on files: the pre-fill attaches the same file to a second form.
CREATE TABLE IF NOT EXISTS onboarding_answer_files
(
    id UUID PRIMARY KEY,
    form_id UUID NOT NULL,
    field_id UUID NOT NULL,
    group_entry_id UUID,
    file_id UUID NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_answer_files_form_fk FOREIGN KEY (form_id) REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answer_files_field_fk FOREIGN KEY (field_id)
        REFERENCES onboarding_fields (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answer_files_entry_form_fk FOREIGN KEY (group_entry_id, form_id)
        REFERENCES onboarding_group_entries (id, form_id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answer_files_file_fk FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_answer_files_slot_uidx UNIQUE NULLS NOT DISTINCT (field_id, group_entry_id, file_id),
    CONSTRAINT onboarding_answer_files_position_check CHECK (position >= 0 AND position < 100)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS onboarding_answer_files_file_idx ON onboarding_answer_files (file_id);
--> statement-breakpoint
-- Frozen at completion (Task 70); until then the form shows the live project line items.
CREATE TABLE IF NOT EXISTS onboarding_form_services
(
    id UUID PRIMARY KEY,
    form_id UUID NOT NULL,
    project_line_item_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT onboarding_form_services_form_fk FOREIGN KEY (form_id) REFERENCES onboarding_forms (id) ON DELETE CASCADE,
    CONSTRAINT onboarding_form_services_line_item_fk FOREIGN KEY (project_line_item_id)
        REFERENCES project_line_items (id) ON DELETE SET NULL,
    CONSTRAINT onboarding_form_services_position_uidx UNIQUE (form_id, position),
    CONSTRAINT onboarding_form_services_position_check CHECK (position >= 0)
);
--> statement-breakpoint

-- Onboarding catalog (workspace-wide, like line_item_templates.* in 0034) and the portal form (like 0046).
-- Custom portal roles deliberately receive no new permissions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('onboarding_templates.read', 'workspace', TRUE, FALSE, 'View the onboarding building blocks and templates.'),
       ('onboarding_templates.write', 'workspace', TRUE, FALSE,
        'Create, edit and archive onboarding building blocks and templates.'),
       ('portal.onboarding.read', 'portal', TRUE, FALSE, 'See released onboarding forms with their answers and files.'),
       ('portal.onboarding.submit', 'portal', TRUE, FALSE, 'Fill in, attach files to and submit onboarding forms.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- Workspace owner and workspace member, the same system roles that hold line_item_templates.*.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key IN ('onboarding_templates.read', 'onboarding_templates.write')
  AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02')
ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.onboarding.read', 'portal.onboarding.submit')
ON CONFLICT (role_id, permission_key) DO NOTHING;
