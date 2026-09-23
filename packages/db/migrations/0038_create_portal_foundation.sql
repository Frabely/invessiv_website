-- Ordner 12a (Task 49): portal foundation. Adds the portal realm's first permission and its
-- default system role, plus the four portal tables. The feature stays invisible after this
-- migration: nothing creates an invitation until Ordner 12b builds that flow, and the portal
-- routes gate behind FeatureFlag.Portal in application code.

-- Widen roles.system_key to allow the portal's default system role.
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_system_key_check;
ALTER TABLE roles
    ADD CONSTRAINT roles_system_key_check CHECK (system_key IN (
                                                                'workspace_owner', 'workspace_member',
                                                                'workspace_credentials_manager', 'portal_standard'
        ));
--> statement-breakpoint

-- Widen the security event catalog for invitation, redemption, revocation and role changes.
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_type_check;
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
                                                              'portal_membership_roles_replaced'
        ));
--> statement-breakpoint

ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_subject_type_check;
ALTER TABLE security_events
    ADD CONSTRAINT security_events_subject_type_check CHECK (subject_type IN (
                                                                              'workspace_member', 'role',
                                                                              'portal_invitation', 'portal_membership'
        ));
--> statement-breakpoint

-- Mirror of PERMISSION_DEFINITIONS; db:smoke:rbac compares both directions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.access', 'portal', TRUE, FALSE, 'Enter this customer''s portal.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- Fixed id mirrors SYSTEM_ROLE_DEFINITIONS.
INSERT INTO roles (id, realm, system_key, name, description, is_system, active, scope_assignable, version)
VALUES ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', 'portal', 'portal_standard', 'Portal standard', NULL, TRUE, TRUE,
        FALSE, 1) ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- Portal standard holds every portal permission that exists so far; later portal folders extend
-- this same insert with their own new permission keys.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key = 'portal.access' ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- A membership can only exist for a customer/person pair that is a real contact assignment, not
-- any customer/person pair that happens to both exist. user_id is deliberately not unique: the
-- same person carries one row per customer they were invited to.
CREATE TABLE IF NOT EXISTS portal_memberships
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
    person_id UUID NOT NULL REFERENCES people
(
    id
)
  ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users
(
    id
)
  ON DELETE RESTRICT,
    activated_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    email_notifications_enabled BOOLEAN NOT NULL,
    customer_notified_at TIMESTAMPTZ,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT portal_memberships_version_check CHECK
(
    version >
    0
),
    -- Cascade, not restrict: mirrors the direct customer_id -> customers cascade above. A purge
    -- that deletes the customer (and with it the contact assignment) must not be blocked by a
    -- membership that would otherwise need deleting first through a different FK path.
    CONSTRAINT portal_memberships_assignment_fkey FOREIGN KEY
(
    customer_id,
    person_id
)
    REFERENCES customer_contact_assignments
(
    customer_id,
    person_id
)
  ON DELETE CASCADE
    );
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS portal_memberships_customer_person_uidx
    ON portal_memberships (customer_id, person_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS portal_memberships_active_user_idx
    ON portal_memberships (user_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS portal_memberships_active_customer_idx
    ON portal_memberships (customer_id) WHERE revoked_at IS NULL;
--> statement-breakpoint

-- Only the SHA-256 hash is stored; the plaintext exists only in the response to the inviter and,
-- from Ordner 20c, in the outbox mail payload. The partial unique index allows exactly one open
-- (unredeemed, unrevoked) invitation per assignment.
CREATE TABLE IF NOT EXISTS portal_invitations
(
    id
    UUID
    PRIMARY
    KEY,
    assignment_id
    UUID
    NOT
    NULL
    REFERENCES
    customer_contact_assignments
(
    id
) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    email_notifications_enabled BOOLEAN NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
)
  ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT portal_invitations_redemption_state_check CHECK
(
    redeemed_at
    IS
    NULL
    OR
    revoked_at
    IS
    NULL
)
    );
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS portal_invitations_token_hash_uidx
    ON portal_invitations (token_hash);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS portal_invitations_open_uidx
    ON portal_invitations (assignment_id) WHERE redeemed_at IS NULL AND revoked_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS portal_invitations_expires_at_idx
    ON portal_invitations (expires_at) WHERE redeemed_at IS NULL AND revoked_at IS NULL;
--> statement-breakpoint

-- role_realm is pinned to 'portal' and part of the foreign key, so a workspace role can never be
-- assigned to a portal membership. A membership may hold several roles.
CREATE TABLE IF NOT EXISTS portal_membership_roles
(
    portal_membership_id
    UUID
    NOT
    NULL
    REFERENCES
    portal_memberships
(
    id
) ON DELETE CASCADE,
    role_id UUID NOT NULL,
    role_realm TEXT NOT NULL CONSTRAINT portal_membership_roles_role_realm_check CHECK
(
    role_realm
    IN
(
    'portal'
)),
    assigned_by_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
)
  ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT portal_membership_roles_pkey PRIMARY KEY
(
    portal_membership_id,
    role_id
),
    CONSTRAINT portal_membership_roles_role_fkey FOREIGN KEY
(
    role_id,
    role_realm
)
    REFERENCES roles
(
    id,
    realm
)
  ON DELETE RESTRICT
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS portal_membership_roles_role_id_idx
    ON portal_membership_roles (role_id);
--> statement-breakpoint

-- The roles chosen at invite time, carried over into portal_membership_roles on redeem. Same
-- realm pin as portal_membership_roles, for the same reason.
CREATE TABLE IF NOT EXISTS portal_invitation_roles
(
    portal_invitation_id
    UUID
    NOT
    NULL
    REFERENCES
    portal_invitations
(
    id
) ON DELETE CASCADE,
    role_id UUID NOT NULL,
    role_realm TEXT NOT NULL CONSTRAINT portal_invitation_roles_role_realm_check CHECK
(
    role_realm
    IN
(
    'portal'
)),
    CONSTRAINT portal_invitation_roles_pkey PRIMARY KEY
(
    portal_invitation_id,
    role_id
),
    CONSTRAINT portal_invitation_roles_role_fkey FOREIGN KEY
(
    role_id,
    role_realm
)
    REFERENCES roles
(
    id,
    realm
)
  ON DELETE RESTRICT
    );
