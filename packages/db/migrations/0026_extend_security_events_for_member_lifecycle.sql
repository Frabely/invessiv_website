-- Member lifecycle management adds activation, deactivation and responsibility handover events.
-- The CHECK constraint is widened only; the previous app version remains compatible.

ALTER TABLE security_events
DROP
CONSTRAINT IF EXISTS security_events_type_check;
--> statement-breakpoint
ALTER TABLE security_events
    ADD CONSTRAINT security_events_type_check CHECK (
        type IN (
                 'workspace_owner_bootstrapped',
                 'workspace_member_added',
                 'workspace_member_roles_changed',
                 'workspace_owner_granted',
                 'workspace_owner_revoked',
                 'workspace_member_deactivated',
                 'workspace_member_activated',
                 'workspace_responsibilities_handed_over',
                 'role_created',
                 'role_updated'
            )
        );
