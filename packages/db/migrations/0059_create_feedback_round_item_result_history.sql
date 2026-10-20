CREATE TABLE IF NOT EXISTS feedback_round_item_result_history (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL,
  item_version INTEGER NOT NULL,
  event_kind TEXT NOT NULL,
  result TEXT,
  result_note TEXT,
  result_set_by_member_id UUID,
  result_set_at TIMESTAMPTZ,
  actor_side TEXT NOT NULL,
  actor_member_id UUID,
  actor_portal_membership_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL,
  command_id UUID,
  request_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_round_item_result_history_item_fk FOREIGN KEY (item_id) REFERENCES feedback_round_items (id) ON DELETE CASCADE,
  CONSTRAINT feedback_round_item_result_history_result_set_by_fk FOREIGN KEY (result_set_by_member_id) REFERENCES workspace_members (id),
  CONSTRAINT feedback_round_item_result_history_actor_member_fk FOREIGN KEY (actor_member_id) REFERENCES workspace_members (id),
  CONSTRAINT feedback_round_item_result_history_actor_portal_membership_fk FOREIGN KEY (actor_portal_membership_id) REFERENCES portal_memberships (id) ON DELETE SET NULL,
  CONSTRAINT feedback_round_item_result_history_item_version_uidx UNIQUE (item_id, item_version),
  CONSTRAINT feedback_round_item_result_history_event_kind_check CHECK (event_kind IN ('baseline', 'set', 'reset')),
  CONSTRAINT feedback_round_item_result_history_actor_side_check CHECK (actor_side IN ('member', 'portal_contact')),
  CONSTRAINT feedback_round_item_result_history_result_check CHECK (result IN ('implemented', 'not_implemented', 'additional_service')),
  CONSTRAINT feedback_round_item_result_history_result_note_length_check CHECK (length(result_note) <= 2000),
  CONSTRAINT feedback_round_item_result_history_item_version_check CHECK (item_version > 0),
  CONSTRAINT feedback_round_item_result_history_request_version_check CHECK (request_version > 0),
  CONSTRAINT feedback_round_item_result_history_snapshot_check CHECK (
    (event_kind = 'reset' AND num_nonnulls(result, result_note, result_set_by_member_id, result_set_at) = 0)
    OR (event_kind <> 'reset' AND num_nonnulls(result, result_set_by_member_id, result_set_at) = 3
      AND (result_note IS NULL OR result IS NOT NULL))
  ),
  CONSTRAINT feedback_round_item_result_history_result_reply_check CHECK (
    result IS NULL OR result NOT IN ('not_implemented', 'additional_service') OR btrim(coalesce(result_note, '')) <> ''
  ),
  CONSTRAINT feedback_round_item_result_history_actor_check CHECK (
    (actor_side = 'member' AND actor_member_id IS NOT NULL AND actor_portal_membership_id IS NULL)
    OR (actor_side = 'portal_contact' AND actor_member_id IS NULL)
  ),
  CONSTRAINT feedback_round_item_result_history_kind_actor_check CHECK (event_kind = 'reset' OR actor_side = 'member'),
  CONSTRAINT feedback_round_item_result_history_command_check CHECK (
    num_nonnulls(command_id, request_version) IN (0, 2) AND (event_kind <> 'baseline' OR command_id IS NULL)
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS feedback_round_item_result_history_item_command_uidx
  ON feedback_round_item_result_history (item_id, command_id) WHERE command_id IS NOT NULL;
