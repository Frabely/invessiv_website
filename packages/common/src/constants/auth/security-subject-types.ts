export const SecuritySubjectType = {
  WorkspaceMember: "workspace_member",
  Role: "role",
} as const;

export type SecuritySubjectType =
  (typeof SecuritySubjectType)[keyof typeof SecuritySubjectType];

export const SECURITY_SUBJECT_TYPE_VALUES = [
  SecuritySubjectType.WorkspaceMember,
  SecuritySubjectType.Role,
] as const;
