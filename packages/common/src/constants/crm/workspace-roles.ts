export const WorkspaceRole = {
  Owner: "owner",
  Member: "member",
} as const;

export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export const WORKSPACE_ROLE_VALUES = [
  WorkspaceRole.Owner,
  WorkspaceRole.Member,
] as const;
