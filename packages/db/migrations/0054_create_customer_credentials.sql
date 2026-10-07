-- Task 18: customer credentials, optionally bound to a project. Secret and note are stored only as
-- ciphertext (format of Task 17). Additive and idempotent; no defaults except the timestamps.
CREATE TABLE IF NOT EXISTS customer_credentials
(
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    project_id UUID,
    title TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    url TEXT,
    username TEXT,
    secret_ciphertext TEXT NOT NULL,
    note_ciphertext TEXT,
    visible_to_customer BOOLEAN NOT NULL,
    created_by_side TEXT NOT NULL,
    created_by_member_id UUID,
    created_by_portal_membership_id UUID,
    secret_changed_at TIMESTAMPTZ NOT NULL,
    last_revealed_at TIMESTAMPTZ,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_credentials_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    -- The composite key keeps a credential from pointing at another customer's project.
    CONSTRAINT customer_credentials_project_customer_fkey FOREIGN KEY (project_id, customer_id)
        REFERENCES projects (id, customer_id),
    -- No cascade on the origin: the history stays referencable.
    CONSTRAINT customer_credentials_created_by_member_fkey FOREIGN KEY (created_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT customer_credentials_created_by_portal_membership_fkey FOREIGN KEY (created_by_portal_membership_id)
        REFERENCES portal_memberships (id),
    CONSTRAINT customer_credentials_title_check CHECK (btrim(title) <> '' AND length(title) <= 120),
    CONSTRAINT customer_credentials_type_check CHECK (credential_type IN (
        'domain_registrar', 'hosting', 'email', 'cms', 'database', 'analytics', 'api_service', 'other'
    )),
    CONSTRAINT customer_credentials_url_check CHECK (length(url) <= 2048),
    CONSTRAINT customer_credentials_username_check CHECK (length(username) <= 320),
    CONSTRAINT customer_credentials_side_check CHECK (created_by_side IN ('internal', 'customer')),
    CONSTRAINT customer_credentials_version_check CHECK (version > 0),
    CONSTRAINT customer_credentials_origin_check CHECK (
        num_nonnulls(created_by_member_id, created_by_portal_membership_id) = 1
        AND (
            (created_by_side = 'internal' AND created_by_member_id IS NOT NULL)
            OR (created_by_side = 'customer' AND created_by_portal_membership_id IS NOT NULL)
        )
    ),
    CONSTRAINT customer_credentials_customer_visible_check CHECK (created_by_side <> 'customer' OR visible_to_customer)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_credentials_customer_type_idx ON customer_credentials (customer_id, credential_type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_credentials_project_idx ON customer_credentials (project_id) WHERE project_id IS NOT NULL;
--> statement-breakpoint

-- Every credential write and every reveal is audited; the list must stay complete (19 existing + 5 new).
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_type_check;
--> statement-breakpoint
ALTER TABLE security_events
    ADD CONSTRAINT security_events_type_check CHECK (type IN (
        'workspace_owner_bootstrapped', 'workspace_member_added',
        'workspace_member_roles_changed',
        'workspace_owner_granted', 'workspace_owner_revoked',
        'workspace_member_deactivated',
        'workspace_member_activated',
        'workspace_responsibilities_handed_over', 'role_created',
        'role_updated', 'workspace_member_access_scope_granted',
        'workspace_member_access_scope_revoked',
        'portal_invitation_created', 'portal_invitation_revoked',
        'portal_invitation_redeemed',
        'portal_membership_revoked',
        'portal_membership_roles_replaced',
        'portal_owner_view_opened',
        'workspace_member_booking_url_changed',
        'credential_created', 'credential_updated', 'credential_deleted',
        'credential_revealed', 'credential_portal_visibility_changed'
    ));
--> statement-breakpoint
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_subject_type_check;
--> statement-breakpoint
ALTER TABLE security_events
    ADD CONSTRAINT security_events_subject_type_check CHECK (subject_type IN (
        'workspace_member', 'role', 'portal_invitation', 'portal_membership', 'customer', 'credential'
    ));
