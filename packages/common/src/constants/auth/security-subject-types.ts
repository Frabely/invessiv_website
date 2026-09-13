export const SecuritySubjectType = {
  WorkspaceMember: "workspace_member",
} as const;

export type SecuritySubjectType =
  (typeof SecuritySubjectType)[keyof typeof SecuritySubjectType];

export const SECURITY_SUBJECT_TYPE_VALUES = [
  SecuritySubjectType.WorkspaceMember,
] as const;
