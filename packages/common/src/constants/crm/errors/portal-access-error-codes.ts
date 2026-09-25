export const PortalAccessErrorCode = {
  CustomerNotFound: "customer_not_found",
  AssignmentNotFound: "assignment_not_found",
  PreviewNotConfirmed: "portal_preview_not_confirmed",
  MembershipAlreadyActive: "portal_membership_already_active",
  InvalidPortalRole: "invalid_portal_role",
  ValidationError: "validation_error",
  NotFound: "not_found",
  InvalidRoles: "invalid_roles",
  Unavailable: "unavailable",
} as const;

export type PortalAccessErrorCode =
  (typeof PortalAccessErrorCode)[keyof typeof PortalAccessErrorCode];
