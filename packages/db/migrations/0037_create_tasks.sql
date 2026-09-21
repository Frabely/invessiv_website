-- Task 11-1 (plans/crm/08-aufgaben): flat project tasks, plus the bindable read permission.
-- `tasks.write` already exists since 0024 and stays as it is.

CREATE TABLE IF NOT EXISTS tasks
(
    id
    UUID
    PRIMARY
    KEY,
    project_id
    UUID
    NOT
    NULL
    REFERENCES
    projects
(
    id
) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    action_side TEXT NOT NULL,
    visible_to_customer BOOLEAN NOT NULL,
    assignee_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
),
    due_on DATE,
    completed_at TIMESTAMPTZ,
    completed_by_member_id UUID REFERENCES workspace_members
(
    id
),
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    CONSTRAINT tasks_title_check CHECK
(
    btrim
(
    title
) <> ''),
    CONSTRAINT tasks_status_check CHECK
(
    status
    IN
(
    'open',
    'in_progress',
    'done',
    'cancelled'
)),
    CONSTRAINT tasks_action_side_check CHECK
(
    action_side
    IN
(
    'internal',
    'customer'
)),
    CONSTRAINT tasks_customer_action_visible_check CHECK
(
    action_side
    <>
    'customer'
    OR
    visible_to_customer
),
    CONSTRAINT tasks_completion_consistency_check CHECK
(
(
    status =
    'done'
) =
(
    completed_at
    IS
    NOT
    NULL
    AND
    completed_by_member_id
    IS
    NOT
    NULL
)),
    CONSTRAINT tasks_version_check CHECK
(
    version >
    0
)
    );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS tasks_project_status_due_idx
    ON tasks (project_id, status, due_on);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS tasks_open_assignee_due_idx
    ON tasks (assignee_member_id, due_on) WHERE status IN ('open', 'in_progress');
--> statement-breakpoint

-- Bindable like `tasks.write`: a customer binding reaches every project of that customer, a
-- project binding only its own project.
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('tasks.read', 'workspace', TRUE, TRUE, 'View the tasks of a project.') ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- New catalog entries are granted to the existing system roles explicitly, see 0035.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key = 'tasks.read'
  AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01',
               '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02') ON CONFLICT (role_id, permission_key) DO NOTHING;
