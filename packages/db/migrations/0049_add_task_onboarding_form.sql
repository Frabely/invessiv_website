-- Task 68: the one internal collecting task of a submitted onboarding form.
-- Additive and idempotent. The link does not cascade: forms only go with a customer purge, which
-- removes the tasks first.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS onboarding_form_id UUID;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE tasks
    ADD CONSTRAINT tasks_onboarding_form_project_fk FOREIGN KEY (onboarding_form_id, project_id)
        REFERENCES onboarding_forms (id, project_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE tasks
    ADD CONSTRAINT tasks_onboarding_form_side_check CHECK (onboarding_form_id IS NULL OR action_side = 'internal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE tasks
    ADD CONSTRAINT tasks_single_origin_check CHECK (num_nonnulls(feedback_round_id, onboarding_form_id) <= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS tasks_onboarding_form_uidx ON tasks (onboarding_form_id)
    WHERE onboarding_form_id IS NOT NULL;
