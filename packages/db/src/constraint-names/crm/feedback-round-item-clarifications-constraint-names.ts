export const FeedbackRoundItemClarificationsConstraintName = {
  ItemForeignKey: "feedback_round_item_clarifications_item_fk",
  RequestedByForeignKey: "feedback_round_item_clarifications_requested_by_fk",
  AnsweredByForeignKey: "feedback_round_item_clarifications_answered_by_fk",
  ClosedByForeignKey: "feedback_round_item_clarifications_closed_by_fk",
  OpenItemUnique: "feedback_round_item_clarifications_open_item_uidx",
  ItemRequestedIndex: "feedback_round_item_clarifications_item_requested_idx",
  AnswerCommandUnique: "feedback_round_item_clarifications_answer_command_uidx",
  CloseCommandUnique: "feedback_round_item_clarifications_close_command_uidx",
  StatusCheck: "feedback_round_item_clarifications_status_check",
  QuestionCheck: "feedback_round_item_clarifications_question_check",
  AnswerCheck: "feedback_round_item_clarifications_answer_check",
  CloseNoteCheck: "feedback_round_item_clarifications_close_note_check",
  VersionCheck: "feedback_round_item_clarifications_version_check",
  RequestVersionCheck:
    "feedback_round_item_clarifications_request_version_check",
  AnswerRequestVersionCheck:
    "feedback_round_item_clarifications_answer_request_version_check",
  CloseRequestVersionCheck:
    "feedback_round_item_clarifications_close_request_version_check",
  StateCheck: "feedback_round_item_clarifications_state_check",
} as const;
