export const SecuritySubjectType = {
  WorkspaceMember: "workspace_member",
  Role: "role",
  PortalInvitation: "portal_invitation",
  PortalMembership: "portal_membership",
  Customer: "customer",
} as const;

export type SecuritySubjectType =
  (typeof SecuritySubjectType)[keyof typeof SecuritySubjectType];

export const SECURITY_SUBJECT_TYPE_VALUES = [
  SecuritySubjectType.WorkspaceMember,
  SecuritySubjectType.Role,
  SecuritySubjectType.PortalInvitation,
  SecuritySubjectType.PortalMembership,
  SecuritySubjectType.Customer,
] as const;
