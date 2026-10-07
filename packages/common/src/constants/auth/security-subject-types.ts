export const SecuritySubjectType = {
  WorkspaceMember: "workspace_member",
  Role: "role",
  PortalInvitation: "portal_invitation",
  PortalMembership: "portal_membership",
  Customer: "customer",
  Credential: "credential",
} as const;

export type SecuritySubjectType =
  (typeof SecuritySubjectType)[keyof typeof SecuritySubjectType];

export const SECURITY_SUBJECT_TYPE_VALUES = [
  SecuritySubjectType.WorkspaceMember,
  SecuritySubjectType.Role,
  SecuritySubjectType.PortalInvitation,
  SecuritySubjectType.PortalMembership,
  SecuritySubjectType.Customer,
  SecuritySubjectType.Credential,
] as const;
