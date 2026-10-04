/** Bounds customer requests and the closed task history shown in the portal. */
export const PortalTaskRequestLimits = {
  /** Open or running customer-created tasks per project; closed ones free a slot again. */
  OpenPerProject: 20,
  /** Rejected customer-created tasks the dashboard keeps showing, newest first. */
  RejectedShown: 5,
  /** Recently completed team tasks retained in the dashboard widget. */
  CompletedShown: 5,
  /** Recently completed customer-side tasks retained for the customer's history. */
  CustomerCompletedShown: 20,
} as const;

export type PortalTaskRequestLimit =
  (typeof PortalTaskRequestLimits)[keyof typeof PortalTaskRequestLimits];
