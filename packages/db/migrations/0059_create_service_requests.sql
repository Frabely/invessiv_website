CREATE UNIQUE INDEX IF NOT EXISTS portal_memberships_id_customer_uidx ON portal_memberships (id, customer_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS service_requests (
id UUID PRIMARY KEY,
customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
line_item_template_id UUID REFERENCES line_item_templates(id) ON DELETE SET NULL,
kind TEXT NOT NULL,
title TEXT NOT NULL,
note TEXT NOT NULL,
requested_minutes INTEGER,
project_wish TEXT NOT NULL,
requested_project_id UUID,
requested_by_membership_id UUID NOT NULL,
status TEXT NOT NULL,
decline_reason TEXT,
offered_at TIMESTAMPTZ,
decided_at TIMESTAMPTZ,
decided_by_member_id UUID REFERENCES workspace_members(id),
project_id UUID,
project_line_item_id UUID REFERENCES project_line_items(id) ON DELETE SET NULL,
idempotency_key UUID NOT NULL,
version INTEGER NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CONSTRAINT service_requests_requested_project_customer_fkey FOREIGN KEY (requested_project_id, customer_id) REFERENCES projects(id, customer_id) ON DELETE CASCADE,
CONSTRAINT service_requests_project_customer_fkey FOREIGN KEY (project_id, customer_id) REFERENCES projects(id, customer_id) ON DELETE CASCADE,
CONSTRAINT service_requests_membership_customer_fkey FOREIGN KEY (requested_by_membership_id, customer_id) REFERENCES portal_memberships(id, customer_id),
CONSTRAINT service_requests_kind_check CHECK (kind IN ('standard','hours','feedback_round')),
CONSTRAINT service_requests_title_check CHECK (btrim(title) <> '' AND length(title) <= 160),
CONSTRAINT service_requests_note_check CHECK (length(note) <= 2000),
CONSTRAINT service_requests_minutes_check CHECK (requested_minutes IS NULL OR (requested_minutes > 0 AND requested_minutes % 15 = 0 AND requested_minutes <= 600000)),
CONSTRAINT service_requests_kind_minutes_check CHECK ((requested_minutes IS NOT NULL) = (kind = 'hours')),
CONSTRAINT service_requests_project_wish_check CHECK (project_wish IN ('existing','new','undecided')),
CONSTRAINT service_requests_wish_project_check CHECK ((project_wish = 'existing') = (requested_project_id IS NOT NULL)),
CONSTRAINT service_requests_status_check CHECK (status IN ('requested','offered','accepted','declined','withdrawn')),
CONSTRAINT service_requests_decline_reason_check CHECK (decline_reason IS NULL OR length(decline_reason) <= 500),
CONSTRAINT service_requests_accepted_check CHECK (status <> 'accepted' OR (project_id IS NOT NULL AND decided_at IS NOT NULL AND decided_by_member_id IS NOT NULL)),
CONSTRAINT service_requests_declined_check CHECK (status <> 'declined' OR (decline_reason IS NOT NULL AND btrim(decline_reason) <> '' AND decided_by_member_id IS NOT NULL)),
CONSTRAINT service_requests_version_check CHECK (version > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS service_requests_idempotency_key_uidx ON service_requests(idempotency_key);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_requests_customer_created_idx ON service_requests(customer_id, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS service_requests_status_created_idx ON service_requests(status, created_at DESC);
--> statement-breakpoint
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('service_requests.read','workspace',TRUE,TRUE,'View customer service requests.'),
('service_requests.write','workspace',TRUE,TRUE,'Offer, decline and accept customer service requests.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key, permission_delegable, permission_scope_assignable)
SELECT r.id, p.realm, TRUE, r.scope_assignable, p.key, p.delegable, p.scope_assignable
FROM permissions p CROSS JOIN roles r
WHERE p.key IN ('service_requests.read','service_requests.write')
AND r.id IN ('7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01','7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a02')
ON CONFLICT (role_id, permission_key) DO NOTHING;
