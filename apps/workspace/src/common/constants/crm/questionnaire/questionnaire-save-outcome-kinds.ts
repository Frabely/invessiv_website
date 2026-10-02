/** How the last save of an inline editor of the kit ended; drives the line next to its button. */
export const QuestionnaireSaveOutcomeKind = {
  Saved: "saved",
  Conflict: "conflict",
  Failure: "failure",
} as const;

export type QuestionnaireSaveOutcomeKind =
  (typeof QuestionnaireSaveOutcomeKind)[keyof typeof QuestionnaireSaveOutcomeKind];
