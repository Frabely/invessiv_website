-- CRM core schema, purely additive. No existing table is modified.
-- The foreign key on lead_categories uses the existing table without altering it.
-- Order: workspace_members and people before customers, customers before the assignments.

CREATE TABLE IF NOT EXISTS workspace_members
(
    id
    UUID
    PRIMARY
    KEY,
    clerk_user_id
    TEXT
    NOT
    NULL,
    email
    TEXT
    NOT
    NULL
    CHECK (
    BTRIM
(
    email
) <> ''),
    role TEXT NOT NULL
    CHECK
(
    role
    IN
(
    'owner',
    'member'
)),
    active BOOLEAN NOT NULL,
    credentials_access BOOLEAN NOT NULL,
    version INTEGER NOT NULL CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_clerk_user_id_uidx
    ON workspace_members (clerk_user_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_email_lower_uidx
    ON workspace_members (LOWER (BTRIM(email)));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS workspace_members_active_role_idx
    ON workspace_members (role) WHERE active;
--> statement-breakpoint

-- People are global. The same person can be assigned to any number of customers;
-- the assignment holds the role and any differing business contact details.
-- No unique index on the email: it never authorizes and is not a duplicate guard.
CREATE TABLE IF NOT EXISTS people
(
    id
    UUID
    PRIMARY
    KEY,
    display_name
    TEXT
    NOT
    NULL
    CHECK (
    BTRIM
(
    display_name
) <> ''),
    first_name TEXT,
    last_name TEXT,
    primary_email TEXT,
    primary_phone TEXT,
    preferred_locale TEXT NOT NULL
    CHECK
(
    preferred_locale
    IN
(
    'de',
    'en'
)),
    notes TEXT,
    version INTEGER NOT NULL CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS people_primary_email_lower_idx
    ON people (LOWER (BTRIM(primary_email))) WHERE primary_email IS NOT NULL;
--> statement-breakpoint

-- The customer number is speakable and typeable. Gaps are valid: a rolled-back insert
-- consumes a number, and no number is ever reused.
CREATE SEQUENCE IF NOT EXISTS customers_customer_number_seq AS INTEGER START WITH 1 MINVALUE 1;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS customers
(
    id
    UUID
    PRIMARY
    KEY,
    customer_number
    INTEGER
    NOT
    NULL
    DEFAULT
    NEXTVAL
(
    'customers_customer_number_seq'
),
    customer_type TEXT NOT NULL
    CHECK
(
    customer_type
    IN
(
    'company',
    'individual'
)),
    display_name TEXT NOT NULL CHECK
(
    BTRIM
(
    display_name
) <> ''),
    company_name TEXT,
    status TEXT NOT NULL
    CHECK
(
    status
    IN
(
    'active',
    'paused',
    'archived'
)),
    owner_member_id UUID NOT NULL REFERENCES workspace_members
(
    id
),
    category_id UUID REFERENCES lead_categories
(
    id
) ON DELETE SET NULL,
    street TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT,
    website_url TEXT,
    vat_id TEXT,
    notes TEXT,
    default_hourly_rate_cents INTEGER CHECK
(
    default_hourly_rate_cents
    IS
    NULL
    OR
    default_hourly_rate_cents
    >=
    0
),
    retention_review_after_days INTEGER CHECK
(
    retention_review_after_days
    IS
    NULL
    OR
    retention_review_after_days >
    0
),
    version INTEGER NOT NULL CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_number_uidx
    ON customers (customer_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customers_status_created_at_idx
    ON customers (status, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customers_category_id_idx
    ON customers (category_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customers_owner_member_id_idx
    ON customers (owner_member_id);
--> statement-breakpoint

-- Target of the composite foreign keys added by later units (tasks in Task 11,
-- feedback_rounds in Task 22) that guard their denormalized customer_id against the
-- project. Redundant to the primary key, but required as a FK target.
CREATE UNIQUE INDEX IF NOT EXISTS customers_id_customer_number_uidx
    ON customers (id, customer_number);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS customer_contact_assignments
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
    role_label TEXT,
    business_email TEXT,
    business_phone TEXT,
    is_primary BOOLEAN NOT NULL,
    version INTEGER NOT NULL CHECK
(
    version >
    0
),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );
--> statement-breakpoint

-- The database enforces AT MOST one primary contact per customer.
-- AT LEAST one is enforced by the atomic create command (Task 04) — that cannot be
-- expressed as a constraint, because customer and assignment are inserted in sequence.
CREATE UNIQUE INDEX IF NOT EXISTS customer_contact_assignments_primary_uidx
    ON customer_contact_assignments (customer_id) WHERE is_primary;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS customer_contact_assignments_customer_person_uidx
    ON customer_contact_assignments (customer_id, person_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_contact_assignments_customer_id_idx
    ON customer_contact_assignments (customer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS customer_contact_assignments_person_id_idx
    ON customer_contact_assignments (person_id);
