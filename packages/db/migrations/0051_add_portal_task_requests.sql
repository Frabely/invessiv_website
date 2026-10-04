-- Portal tasks: contacts take back their own completion and create tasks for the team.
-- Custom portal roles deliberately receive no new permissions.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.tasks.reopen', 'portal', TRUE, FALSE, 'Reopen tasks this customer completed in the portal.'),
       ('portal.tasks.create', 'portal', TRUE, FALSE,
        'Create tasks for the team in this customer''s portal.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.tasks.reopen', 'portal.tasks.create') ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- Marks a task a customer contact created in the portal. NO ACTION matches
-- completed_by_portal_membership_id: retained membership history must remain referenceable.
-- No index: the origin is read with the task, never used as a lookup key.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS created_by_portal_membership_id UUID CONSTRAINT tasks_created_by_portal_membership_id_fkey REFERENCES portal_memberships (id);
