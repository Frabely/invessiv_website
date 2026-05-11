DO
$$
BEGIN
  IF
EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'lead_activity_type'
  ) THEN
ALTER TYPE "lead_activity_type" ADD VALUE IF NOT EXISTS 'import';
END IF;
END $$;
