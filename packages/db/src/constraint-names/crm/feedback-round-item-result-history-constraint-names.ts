export const FeedbackRoundItemResultHistoryConstraintName = {
  ItemForeignKey: "feedback_round_item_result_history_item_fk",
  ResultSetByForeignKey: "feedback_round_item_result_history_result_set_by_fk",
  ActorMemberForeignKey: "feedback_round_item_result_history_actor_member_fk",
  ActorPortalMembershipForeignKey:
    "feedback_round_item_result_history_actor_portal_membership_fk",
  ItemVersionUnique: "feedback_round_item_result_history_item_version_uidx",
  ItemCommandUnique: "feedback_round_item_result_history_item_command_uidx",
  EventKindCheck: "feedback_round_item_result_history_event_kind_check",
  ActorSideCheck: "feedback_round_item_result_history_actor_side_check",
  ResultCheck: "feedback_round_item_result_history_result_check",
  ResultNoteLengthCheck:
    "feedback_round_item_result_history_result_note_length_check",
  ItemVersionCheck: "feedback_round_item_result_history_item_version_check",
  RequestVersionCheck:
    "feedback_round_item_result_history_request_version_check",
  SnapshotCheck: "feedback_round_item_result_history_snapshot_check",
  ResultReplyCheck: "feedback_round_item_result_history_result_reply_check",
  ActorCheck: "feedback_round_item_result_history_actor_check",
  KindActorCheck: "feedback_round_item_result_history_kind_actor_check",
  CommandCheck: "feedback_round_item_result_history_command_check",
} as const;
