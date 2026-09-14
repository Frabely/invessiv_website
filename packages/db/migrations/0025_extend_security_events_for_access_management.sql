-- Member and role management (unit 03b) writes new security event types and a new subject type.
-- Both CHECK constraints are only widened, never narrowed; the previous app version writes
-- workspace_owner_bootstrapped only and stays compatible.

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
                 'role_created',
                 'role_updated'
            )
        );
--> statement-breakpoint
ALTER TABLE security_events
DROP
CONSTRAINT IF EXISTS security_events_subject_type_check;
--> statement-breakpoint
ALTER TABLE security_events
    ADD CONSTRAINT security_events_subject_type_check CHECK (
        subject_type IN (
                         'workspace_member',
                         'role'
            )
        );
