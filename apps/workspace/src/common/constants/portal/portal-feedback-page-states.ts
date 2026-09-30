/** What the portal feedback page shows for a project; decided once from the page DTO. */
export const PortalFeedbackPageState = {
  /** An open round this contact may edit. */
  Sheet: "sheet",
  /** An open round this viewer may only read (owner view, no submit right). */
  OpenReadOnly: "open_read_only",
  Submitted: "submitted",
  /** The team asked for a call before implementing. */
  Discussion: "discussion",
  /** The team implements the submitted round. */
  Working: "working",
  /** No round was handed over yet. */
  None: "none",
  /** A round is done and the next one is still to come. */
  Between: "between",
  Approved: "approved",
  /** Every round is used and none is running. */
  Exhausted: "exhausted",
} as const;

export type PortalFeedbackPageState =
  (typeof PortalFeedbackPageState)[keyof typeof PortalFeedbackPageState];

export const PORTAL_FEEDBACK_PAGE_STATE_VALUES = [
  PortalFeedbackPageState.Sheet,
  PortalFeedbackPageState.OpenReadOnly,
  PortalFeedbackPageState.Submitted,
  PortalFeedbackPageState.Discussion,
  PortalFeedbackPageState.Working,
  PortalFeedbackPageState.None,
  PortalFeedbackPageState.Between,
  PortalFeedbackPageState.Approved,
  PortalFeedbackPageState.Exhausted,
] as const;
