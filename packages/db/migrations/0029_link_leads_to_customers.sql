ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers (id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS leads_customer_id_idx ON leads (customer_id);
--> statement-breakpoint
DO
$$
DECLARE
constraint_name TEXT;
BEGIN
SELECT conname
INTO constraint_name
FROM pg_constraint
WHERE conrelid = 'activities'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'activities'::regclass AND attname = 'customer_id')
      ];

IF
constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE activities DROP CONSTRAINT %I', constraint_name);
END IF;

    IF
NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'activities'::regclass
          AND conname = 'activities_customer_id_customers_id_fk'
    ) THEN
ALTER TABLE activities
    ADD CONSTRAINT activities_customer_id_customers_id_fk
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL;
END IF;
END
$$;
--> statement-breakpoint
DO
$$
DECLARE
constraint_name TEXT;
BEGIN
SELECT conname
INTO constraint_name
FROM pg_constraint
WHERE conrelid = 'activities'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'activities'::regclass AND attname = 'lead_id')
      ];

IF
constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE activities DROP CONSTRAINT %I', constraint_name);
END IF;

    IF
NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'activities'::regclass
          AND conname = 'activities_lead_id_leads_id_fk'
    ) THEN
ALTER TABLE activities
    ADD CONSTRAINT activities_lead_id_leads_id_fk
        FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE SET NULL;
END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE activities
DROP
CONSTRAINT IF EXISTS activities_subject_check;
--> statement-breakpoint
ALTER TABLE activities
    ADD CONSTRAINT activities_subject_check CHECK (
        lead_id IS NOT NULL
            OR customer_id IS NOT NULL
            OR project_id IS NOT NULL
        );
