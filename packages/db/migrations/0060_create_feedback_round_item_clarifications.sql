CREATE TABLE IF NOT EXISTS feedback_round_item_clarifications (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL,
  status TEXT NOT NULL,
  question TEXT NOT NULL,
  requested_by_member_id UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  request_version INTEGER NOT NULL,
  answer TEXT,
  answered_by_portal_membership_id UUID,
  answered_at TIMESTAMPTZ,
  answer_command_id UUID,
  answer_request_version INTEGER,
  close_note TEXT,
  closed_by_member_id UUID,
  closed_at TIMESTAMPTZ,
  close_command_id UUID,
  close_request_version INTEGER,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_round_item_clarifications_item_fk FOREIGN KEY (item_id) REFERENCES feedback_round_items(id) ON DELETE CASCADE,
  CONSTRAINT feedback_round_item_clarifications_requested_by_fk FOREIGN KEY (requested_by_member_id) REFERENCES workspace_members(id),
  CONSTRAINT feedback_round_item_clarifications_answered_by_fk FOREIGN KEY (answered_by_portal_membership_id) REFERENCES portal_memberships(id) ON DELETE SET NULL,
  CONSTRAINT feedback_round_item_clarifications_closed_by_fk FOREIGN KEY (closed_by_member_id) REFERENCES workspace_members(id),
  CONSTRAINT feedback_round_item_clarifications_status_check CHECK (status IN ('open', 'answered', 'closed')),
  CONSTRAINT feedback_round_item_clarifications_question_check CHECK (btrim(question) <> '' AND length(question) <= 2000),
  CONSTRAINT feedback_round_item_clarifications_answer_check CHECK (btrim(answer) <> '' AND length(answer) <= 2000),
  CONSTRAINT feedback_round_item_clarifications_close_note_check CHECK (btrim(close_note) <> '' AND length(close_note) <= 2000),
  CONSTRAINT feedback_round_item_clarifications_version_check CHECK (version > 0),
  CONSTRAINT feedback_round_item_clarifications_request_version_check CHECK (request_version > 0),
  CONSTRAINT feedback_round_item_clarifications_answer_request_version_check CHECK (answer_request_version > 0),
  CONSTRAINT feedback_round_item_clarifications_close_request_version_check CHECK (close_request_version > 0),
  CONSTRAINT feedback_round_item_clarifications_state_check CHECK (
    (status = 'open' AND num_nonnulls(
      answer, answered_by_portal_membership_id, answered_at, answer_command_id, answer_request_version,
      close_note, closed_by_member_id, closed_at, close_command_id, close_request_version
    ) = 0)
    OR (status = 'answered'
      AND num_nonnulls(answer, answered_at, answer_command_id, answer_request_version) = 4
      AND num_nonnulls(close_note, closed_by_member_id, closed_at, close_command_id, close_request_version) = 0
    )
    OR (status = 'closed'
      AND num_nonnulls(close_note, closed_by_member_id, closed_at, close_command_id, close_request_version) = 5
      AND num_nonnulls(answer, answered_by_portal_membership_id, answered_at, answer_command_id, answer_request_version) = 0
    )
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_round_item_clarifications_open_item_uidx ON feedback_round_item_clarifications (item_id) WHERE status = 'open';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS feedback_round_item_clarifications_item_requested_idx ON feedback_round_item_clarifications (item_id, requested_at, id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_round_item_clarifications_answer_command_uidx ON feedback_round_item_clarifications (item_id, answer_command_id) WHERE answer_command_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_round_item_clarifications_close_command_uidx ON feedback_round_item_clarifications (item_id, close_command_id) WHERE close_command_id IS NOT NULL;
