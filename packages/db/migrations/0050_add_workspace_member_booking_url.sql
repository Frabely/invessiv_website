-- Task 69: the booking link a member offers for the onboarding call.
-- Additive and idempotent. The link is optional; clearing it is the rollback of the feature.
ALTER TABLE workspace_members
    ADD COLUMN IF NOT EXISTS booking_url TEXT;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_booking_url_check CHECK (
        booking_url IS NULL
        OR (booking_url LIKE 'https://%' AND length(booking_url) <= 2048)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- A link changed by someone else is an access-relevant change and gets its own event type.
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
        'workspace_member_booking_url_changed'
    ));
