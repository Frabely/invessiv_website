/** Where an autosave stands; the status line words each one. */
export const DraftSaveState = {
  Idle: "idle",
  Unsaved: "unsaved",
  Saving: "saving",
  Saved: "saved",
  Failed: "failed",
  Conflict: "conflict",
} as const;

export type DraftSaveState =
  (typeof DraftSaveState)[keyof typeof DraftSaveState];

export const DRAFT_SAVE_STATE_VALUES = [
  DraftSaveState.Idle,
  DraftSaveState.Unsaved,
  DraftSaveState.Saving,
  DraftSaveState.Saved,
  DraftSaveState.Failed,
  DraftSaveState.Conflict,
] as const;
