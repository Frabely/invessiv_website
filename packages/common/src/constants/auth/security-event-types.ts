export const SecurityEventType = {
  WorkspaceOwnerBootstrapped: "workspace_owner_bootstrapped",
} as const;

export type SecurityEventType =
  (typeof SecurityEventType)[keyof typeof SecurityEventType];

export const SECURITY_EVENT_TYPE_VALUES = [
  SecurityEventType.WorkspaceOwnerBootstrapped,
] as const;
