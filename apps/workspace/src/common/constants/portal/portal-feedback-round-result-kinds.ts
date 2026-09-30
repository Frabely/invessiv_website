export const PortalFeedbackRoundResultKind = {
  Success: "success",
  Conflict: "conflict",
  ItemTextRequired: "itemTextRequired",
  Locked: "locked",
  Error: "error",
} as const;

export type PortalFeedbackRoundResultKind =
  (typeof PortalFeedbackRoundResultKind)[keyof typeof PortalFeedbackRoundResultKind];
