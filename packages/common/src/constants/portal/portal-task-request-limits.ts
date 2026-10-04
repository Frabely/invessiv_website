/** Bounds what a customer can queue for the team, so the portal cannot flood a project. */
export const PortalTaskRequestLimits = {
  /** Open or running customer-created tasks per project; closed ones free a slot again. */
  OpenPerProject: 20,
  /** Rejected customer-created tasks the dashboard keeps showing, newest first. */
  RejectedShown: 5,
} as const;

export type PortalTaskRequestLimit =
  (typeof PortalTaskRequestLimits)[keyof typeof PortalTaskRequestLimits];
