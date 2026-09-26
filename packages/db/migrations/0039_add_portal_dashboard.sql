-- Portal dashboard foundation. Custom portal roles deliberately receive no new permissions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.projects.read', 'portal', TRUE, FALSE, 'See released project status, steps and next step.'),
       ('portal.tasks.read', 'portal', TRUE, FALSE, 'View customer-visible tasks in this customer''s portal.'),
       ('portal.tasks.complete', 'portal', TRUE, FALSE,
        'Complete customer-side tasks in this customer''s portal.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.projects.read', 'portal.tasks.read',
                'portal.tasks.complete') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- NO ACTION matches completed_by_member_id: retained membership history must remain referenceable.
-- No index: completion origin is read with the task, never used as a lookup key.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS completed_by_portal_membership_id UUID CONSTRAINT tasks_completed_by_portal_membership_id_fkey REFERENCES portal_memberships (id);
--> statement-breakpoint

DO
$$
BEGIN
    IF
EXISTS (
        SELECT 1 FROM tasks
        WHERE NOT (
            (status = 'done') = (
                completed_at IS NOT NULL
                AND num_nonnulls(completed_by_member_id, completed_by_portal_membership_id) = 1
            )
        ) OR (completed_by_portal_membership_id IS NOT NULL AND action_side <> 'customer')
    ) THEN
        RAISE EXCEPTION 'Existing task completion data violates the portal dashboard invariants';
END IF;
END $$;
--> statement-breakpoint

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_completion_consistency_check;
--> statement-breakpoint
ALTER TABLE tasks
    ADD CONSTRAINT tasks_completion_consistency_check CHECK (
        (status = 'done') = (
            completed_at IS NOT NULL
                AND num_nonnulls(completed_by_member_id, completed_by_portal_membership_id) = 1
            )
        );
--> statement-breakpoint

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_portal_completion_customer_side_check;
--> statement-breakpoint
ALTER TABLE tasks
    ADD CONSTRAINT tasks_portal_completion_customer_side_check CHECK (
        completed_by_portal_membership_id IS NULL OR action_side = 'customer'
        );
--> statement-breakpoint

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
                                                              'portal_owner_view_opened'
        ));
--> statement-breakpoint

-- Owner views address a customer, even when the owner has no portal membership there.
ALTER TABLE security_events DROP CONSTRAINT IF EXISTS security_events_subject_type_check;
--> statement-breakpoint
ALTER TABLE security_events
    ADD CONSTRAINT security_events_subject_type_check CHECK (subject_type IN (
                                                                              'workspace_member', 'role',
                                                                              'portal_invitation', 'portal_membership',
                                                                              'customer'
        ));
