-- Task 27 (plans/crm/20-stunden-und-history): purchased hours per customer, their allocation to
-- projects and the time entries that consume them. Balances are never stored; they are sums over
-- these rows. Additive and idempotent; no defaults except the timestamps.

-- Target of the composite key that binds a time entry's task to the entry's own project.
CREATE UNIQUE INDEX IF NOT EXISTS tasks_id_project_uidx ON tasks (id, project_id);
--> statement-breakpoint

-- Immutable ledger: a purchase is never updated or deleted, only corrected by a negative row.
CREATE TABLE IF NOT EXISTS customer_hour_purchases
(
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    kind TEXT NOT NULL,
    source TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    purchased_on DATE NOT NULL,
    note TEXT NOT NULL,
    idempotency_key UUID NOT NULL,
    created_by_member_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_hour_purchases_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    -- No cascade on the author: the history stays referencable.
    CONSTRAINT customer_hour_purchases_created_by_member_fkey FOREIGN KEY (created_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT customer_hour_purchases_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT customer_hour_purchases_kind_check CHECK (kind IN ('purchase', 'correction')),
    CONSTRAINT customer_hour_purchases_source_check CHECK (source IN ('manual')),
    CONSTRAINT customer_hour_purchases_minutes_check CHECK (minutes <> 0 AND minutes % 15 = 0 AND abs(minutes) <= 600000),
    CONSTRAINT customer_hour_purchases_kind_sign_check CHECK (
        (kind = 'purchase' AND minutes > 0) OR (kind = 'correction' AND minutes < 0)
    ),
    CONSTRAINT customer_hour_purchases_note_check CHECK (length(note) <= 200)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_hour_purchases_customer_purchased_idx
    ON customer_hour_purchases (customer_id, purchased_on DESC, created_at DESC);
--> statement-breakpoint

-- Immutable ledger: positive rows allocate free hours to a project, negative rows release them.
CREATE TABLE IF NOT EXISTS project_hour_allocations
(
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    project_id UUID NOT NULL,
    minutes INTEGER NOT NULL,
    note TEXT NOT NULL,
    idempotency_key UUID NOT NULL,
    created_by_member_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_hour_allocations_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    -- The composite key keeps an allocation from pointing at another customer's project.
    CONSTRAINT project_hour_allocations_project_customer_fkey FOREIGN KEY (project_id, customer_id)
        REFERENCES projects (id, customer_id) ON DELETE CASCADE,
    CONSTRAINT project_hour_allocations_created_by_member_fkey FOREIGN KEY (created_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT project_hour_allocations_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT project_hour_allocations_minutes_check CHECK (minutes <> 0 AND minutes % 15 = 0 AND abs(minutes) <= 600000),
    CONSTRAINT project_hour_allocations_note_check CHECK (length(note) <= 200)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_hour_allocations_customer_created_idx
    ON project_hour_allocations (customer_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_hour_allocations_project_idx ON project_hour_allocations (project_id);
--> statement-breakpoint

-- Written from Task 72 on; created here so the whole schema of the folder ships in one migration.
CREATE TABLE IF NOT EXISTS project_time_entries
(
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    project_id UUID NOT NULL,
    task_id UUID,
    performed_on DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT NOT NULL,
    billable BOOLEAN NOT NULL,
    performed_by_member_id UUID NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_time_entries_customer_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT project_time_entries_project_customer_fkey FOREIGN KEY (project_id, customer_id)
        REFERENCES projects (id, customer_id) ON DELETE CASCADE,
    -- No cascade: tasks have no delete path and only vanish with their project, which removes the
    -- entry through its own project key. SET NULL would also clear project_id.
    CONSTRAINT project_time_entries_task_project_fkey FOREIGN KEY (task_id, project_id)
        REFERENCES tasks (id, project_id),
    CONSTRAINT project_time_entries_performed_by_member_fkey FOREIGN KEY (performed_by_member_id)
        REFERENCES workspace_members (id),
    CONSTRAINT project_time_entries_duration_check CHECK (
        duration_minutes > 0 AND duration_minutes % 15 = 0 AND duration_minutes <= 1440
    ),
    CONSTRAINT project_time_entries_description_check CHECK (btrim(description) <> '' AND length(description) <= 500),
    CONSTRAINT project_time_entries_version_check CHECK (version > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_time_entries_project_performed_idx
    ON project_time_entries (project_id, performed_on DESC, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_time_entries_customer_performed_idx
    ON project_time_entries (customer_id, performed_on DESC, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS project_time_entries_task_idx ON project_time_entries (task_id) WHERE task_id IS NOT NULL;
--> statement-breakpoint

-- Reading and booking are bindable to a customer or a project; managing the stock is a
-- customer-level decision and therefore only bindable to a customer (see the permission catalog).
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('hours.read', 'workspace', TRUE, TRUE, 'View hour balances, purchases, allocations and time entries.'),
       ('hours.write', 'workspace', TRUE, TRUE, 'Book, change and delete time entries.'),
       ('hours.manage', 'workspace', TRUE, TRUE, 'Record purchased hours and allocate them to projects.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

-- The owner role gets every workspace permission; new catalog entries are granted explicitly.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key IN ('hours.read', 'hours.write', 'hours.manage')
  AND r.id = '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01'
ON CONFLICT (role_id, permission_key) DO NOTHING;
--> statement-breakpoint

-- Members read and book; recording purchases and allocating them stays with the owner.
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
         CROSS JOIN roles AS r
WHERE p.key IN ('hours.read', 'hours.write')
  AND r.id = '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02'
ON CONFLICT (role_id, permission_key) DO NOTHING;
