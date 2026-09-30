/** Where the feedback sheet's autosave stands; the status line words each one. */
export const FeedbackDraftSaveState = {
  Idle: "idle",
  Unsaved: "unsaved",
  Saving: "saving",
  Saved: "saved",
  Failed: "failed",
  Conflict: "conflict",
} as const;

export type FeedbackDraftSaveState =
  (typeof FeedbackDraftSaveState)[keyof typeof FeedbackDraftSaveState];

export const FEEDBACK_DRAFT_SAVE_STATE_VALUES = [
  FeedbackDraftSaveState.Idle,
  FeedbackDraftSaveState.Unsaved,
  FeedbackDraftSaveState.Saving,
  FeedbackDraftSaveState.Saved,
  FeedbackDraftSaveState.Failed,
  FeedbackDraftSaveState.Conflict,
] as const;
