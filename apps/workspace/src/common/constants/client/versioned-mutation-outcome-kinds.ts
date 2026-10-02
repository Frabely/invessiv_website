/** How a versioned write ended, as a surface that stays open afterwards tells it apart. */
export const VersionedMutationOutcomeKind = {
  Saved: "saved",
  Conflict: "conflict",
  Failure: "failure",
} as const;

export type VersionedMutationOutcomeKind =
  (typeof VersionedMutationOutcomeKind)[keyof typeof VersionedMutationOutcomeKind];
