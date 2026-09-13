DO
$$
BEGIN
    IF EXISTS (
        SELECT legacy.id
        FROM lead_activities AS legacy
        LEFT JOIN activities AS migrated ON migrated.id = legacy.id
        WHERE migrated.id IS NULL
           OR migrated.lead_id IS DISTINCT FROM legacy.lead_id
           OR migrated.customer_id IS NOT NULL
           OR migrated.project_id IS NOT NULL
           OR migrated.type IS DISTINCT FROM legacy.type
           OR migrated.title IS DISTINCT FROM legacy.title
           OR migrated.body IS DISTINCT FROM legacy.body
           OR migrated.metadata IS DISTINCT FROM legacy.metadata
           OR migrated.occurred_at IS DISTINCT FROM legacy.occurred_at
           OR migrated.actor_type IS DISTINCT FROM legacy.actor_type
           OR migrated.actor_id IS DISTINCT FROM legacy.actor_id
           OR migrated.actor_label IS DISTINCT FROM legacy.actor_label
           OR migrated.created_at IS DISTINCT FROM legacy.created_at
    ) THEN
        RAISE EXCEPTION 'Complete lead activity migration verification failed';
    END IF;
END
$$;
