CREATE TABLE IF NOT EXISTS files
(
    id
    UUID
    PRIMARY
    KEY,
    customer_id
    UUID
    NOT
    NULL,
    project_id
    UUID,
    feedback_round_id
    UUID,
    source
    TEXT
    NOT
    NULL,
    status
    TEXT
    NOT
    NULL,
    asset_kind
    TEXT
    NOT
    NULL,
    display_name
    TEXT
    NOT
    NULL,
    note
    TEXT,
    visible_to_customer
    BOOLEAN
    NOT
    NULL,
    uploaded_by_side
    TEXT
    NOT
    NULL,
    uploaded_by_member_id
    UUID,
    uploaded_by_portal_membership_id
    UUID,
    storage_key
    TEXT,
    content_type
    TEXT,
    extension
    TEXT,
    size_bytes
    BIGINT,
    inspection_status
    TEXT,
    url
    TEXT,
    orphaned_at
    TIMESTAMPTZ,
    version
    INTEGER
    NOT
    NULL,
    created_at
    TIMESTAMPTZ
    NOT
    NULL
    DEFAULT
    NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT files_customer_fk FOREIGN KEY
(
    customer_id
) REFERENCES customers
(
    id
) ON DELETE CASCADE,
    CONSTRAINT files_project_customer_fk FOREIGN KEY
(
    project_id,
    customer_id
) REFERENCES projects
(
    id,
    customer_id
),
    CONSTRAINT files_member_fk FOREIGN KEY
(
    uploaded_by_member_id
) REFERENCES workspace_members
(
    id
),
    CONSTRAINT files_portal_membership_fk FOREIGN KEY
(
    uploaded_by_portal_membership_id
) REFERENCES portal_memberships
(
    id
),
    CONSTRAINT files_storage_key_unique UNIQUE
(
    storage_key
),
    CONSTRAINT files_source_check CHECK
(
    source
    IN
(
    'upload',
    'link'
)),
    CONSTRAINT files_status_check CHECK
(
    status
    IN
(
    'pending',
    'ready'
)),
    CONSTRAINT files_asset_kind_check CHECK
(
    asset_kind
    IN
(
    'document',
    'image',
    'video',
    'font',
    'link'
)),
    CONSTRAINT files_display_name_check CHECK
(
    btrim
(
    display_name
) <> ''),
    CONSTRAINT files_note_check CHECK
(
    length
(
    note
) <= 200),
    CONSTRAINT files_upload_side_check CHECK
(
    uploaded_by_side
    IN
(
    'internal',
    'customer'
)),
    CONSTRAINT files_size_check CHECK
(
    size_bytes >
    0
),
    CONSTRAINT files_inspection_check CHECK
(
    inspection_status
    IN
(
    'unscanned'
)),
    CONSTRAINT files_url_check CHECK
(
    url
    LIKE
    'https://%'
    AND
    length
(
    url
) <= 2048),
    CONSTRAINT files_version_check CHECK
(
    version >
    0
),
    CONSTRAINT files_source_fields_check CHECK
(
    (
    source =
    'upload'
    AND
    asset_kind
    <>
    'link'
    AND
    num_nonnulls
(
    storage_key,
    content_type,
    extension,
    size_bytes,
    inspection_status
) = 5 AND url IS NULL)
    OR
(
    source =
    'link'
    AND
    asset_kind =
    'link'
    AND
    status =
    'ready'
    AND
    num_nonnulls
(
    storage_key,
    content_type,
    extension,
    size_bytes,
    inspection_status
) = 0 AND url IS NOT NULL)
    ),
    CONSTRAINT files_uploader_check CHECK
(
    num_nonnulls
(
    uploaded_by_member_id,
    uploaded_by_portal_membership_id
) = 1 AND
(
(
    uploaded_by_side =
    'internal'
    AND
    uploaded_by_member_id
    IS
    NOT
    NULL
)
    OR
(
    uploaded_by_side =
    'customer'
    AND
    uploaded_by_portal_membership_id
    IS
    NOT
    NULL
))
    ),
    CONSTRAINT files_customer_visible_check CHECK
(
    uploaded_by_side
    <>
    'customer'
    OR
    visible_to_customer
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS files_customer_ready_idx ON files(customer_id, created_at DESC) WHERE status = 'ready';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS files_project_idx ON files(project_id) WHERE project_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS files_customer_visible_idx ON files(customer_id) WHERE visible_to_customer AND status = 'ready';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS files_pending_idx ON files(status, created_at) WHERE status = 'pending';
--> statement-breakpoint
-- Some installations with 0040 registered still lack the chat.redact catalog entry.
-- Keep that migration immutable and repair the missing catalog entry additively.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('chat.redact', 'workspace', FALSE, FALSE,
        'Hide unlawful content in customer conversations.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable,
                              permission_key, permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key = 'chat.redact'
  AND r.id = '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01' ON CONFLICT (role_id, permission_key) DO NOTHING;
