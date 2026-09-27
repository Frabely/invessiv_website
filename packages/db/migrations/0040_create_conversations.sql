-- Customer-wide conversations and immutable messages. Business values are supplied by writers.
CREATE TABLE IF NOT EXISTS conversations
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
    project_id UUID REFERENCES projects
(
    id
)
  ON DELETE CASCADE,
    owner_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
),
    version INTEGER NOT NULL,
    last_message_at TIMESTAMPTZ,
    internal_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT conversations_version_check CHECK
(
    version >
    0
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS conversations_owner_customer_idx ON conversations (owner_member_id, customer_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS conversations_customer_uidx
    ON conversations (customer_id, COALESCE (project_id, '00000000-0000-0000-0000-000000000000'::uuid));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS messages
(
    id
    UUID
    PRIMARY
    KEY,
    conversation_id
    UUID
    NOT
    NULL
    REFERENCES
    conversations
(
    id
) ON DELETE CASCADE,
    client_message_id UUID,
    customer_id UUID NOT NULL REFERENCES customers
(
    id
)
  ON DELETE CASCADE,
    type TEXT NOT NULL,
    body TEXT,
    metadata JSONB,
    sender_side TEXT NOT NULL,
    sender_member_id UUID REFERENCES workspace_members
(
    id
),
    sender_portal_membership_id UUID REFERENCES portal_memberships
(
    id
),
    sender_display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    redacted_at TIMESTAMPTZ,
    redacted_by_member_id UUID REFERENCES workspace_members
(
    id
),
    CONSTRAINT messages_type_check CHECK
(
    type
    IN
(
    'text',
    'system'
)),
    CONSTRAINT messages_sender_side_check CHECK
(
    sender_side
    IN
(
    'internal',
    'customer',
    'system'
)),
    CONSTRAINT messages_sender_consistency_check CHECK
(
(
    sender_side =
    'internal'
    AND
    sender_member_id
    IS
    NOT
    NULL
    AND
    sender_portal_membership_id
    IS
    NULL
)
    OR
(
    sender_side =
    'customer'
    AND
    sender_member_id
    IS
    NULL
    AND
    sender_portal_membership_id
    IS
    NOT
    NULL
)
    OR
(
    sender_side =
    'system'
    AND
    sender_member_id
    IS
    NULL
    AND
    sender_portal_membership_id
    IS
    NULL
)
    ),
    CONSTRAINT messages_body_check CHECK
(
    body
    IS
    NOT
    NULL
    OR
    redacted_at
    IS
    NOT
    NULL
)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS messages_client_message_uidx ON messages (client_message_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS messages_conversation_order_idx ON messages (conversation_id, created_at DESC, id DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS messages_customer_order_idx ON messages (customer_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS messages_portal_sender_order_idx
    ON messages (sender_portal_membership_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS conversation_reads
(
    id
    UUID
    PRIMARY
    KEY,
    conversation_id
    UUID
    NOT
    NULL
    REFERENCES
    conversations
(
    id
) ON DELETE CASCADE,
    member_id UUID REFERENCES workspace_members
(
    id
)
  ON DELETE CASCADE,
    portal_membership_id UUID REFERENCES portal_memberships
(
    id
)
  ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT conversation_reads_reader_check CHECK
(
    num_nonnulls
(
    member_id,
    portal_membership_id
) = 1)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS conversation_reads_member_uidx
    ON conversation_reads (conversation_id, member_id) WHERE member_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS conversation_reads_portal_member_uidx
    ON conversation_reads (conversation_id, portal_membership_id) WHERE portal_membership_id IS NOT NULL;
--> statement-breakpoint
-- chat.redact is not delegable: only the owner role, which derives every workspace permission, holds it.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('chat.read', 'workspace', TRUE, TRUE, 'Read customer conversations.'),
       ('chat.write', 'workspace', TRUE, TRUE, 'Send messages in customer conversations.'),
       ('chat.redact', 'workspace', FALSE, FALSE, 'Hide unlawful content in customer conversations.'),
       ('portal.messages.read', 'portal', TRUE, FALSE, 'Read this customer''s conversation.'),
       ('portal.messages.write', 'portal', TRUE, FALSE,
        'Send messages in this customer''s conversation.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE (p.key IN ('chat.read', 'chat.write')
    AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01', '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02'))
   OR (p.key = 'chat.redact' AND r.id = '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01')
   OR (p.key IN ('portal.messages.read', 'portal.messages.write')
    AND r.id = '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04')
    ON CONFLICT (role_id, permission_key) DO NOTHING;
