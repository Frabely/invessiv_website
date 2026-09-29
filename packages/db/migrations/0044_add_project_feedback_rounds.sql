-- Each entry places one feedback round before process_steps[p]; p = cardinality(process_steps) places it last.
-- NULL stays readable as "no rounds" for rows written before this migration.
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS feedback_round_positions INTEGER[];
--> statement-breakpoint
DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_feedback_round_positions_check'
  ) THEN
ALTER TABLE projects
    ADD CONSTRAINT projects_feedback_round_positions_check
        CHECK (feedback_round_positions IS NULL
            OR (cardinality(feedback_round_positions) <= 20
                AND array_position(feedback_round_positions, NULL) IS NULL
                AND 0 <= ALL (feedback_round_positions)
                AND cardinality(process_steps) >= ALL (feedback_round_positions)));
END IF;
END $$;
--> statement-breakpoint
-- Widened from 1–20: a project may now carry no feedback round at all.
ALTER TABLE projects
    DROP CONSTRAINT IF EXISTS projects_feedback_rounds_check;
--> statement-breakpoint
ALTER TABLE projects
    ADD CONSTRAINT projects_feedback_rounds_check CHECK (included_feedback_rounds BETWEEN 0 AND 20);
--> statement-breakpoint
DO
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_feedback_rounds_match_check'
  ) THEN
ALTER TABLE projects
    ADD CONSTRAINT projects_feedback_rounds_match_check
        CHECK (feedback_round_positions IS NULL
            OR cardinality(feedback_round_positions) = included_feedback_rounds);
END IF;
END $$;
