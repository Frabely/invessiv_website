export const AuthRealm = {
  Workspace: "workspace",
  Portal: "portal",
} as const;

export type AuthRealm = (typeof AuthRealm)[keyof typeof AuthRealm];

export const AUTH_REALM_VALUES = [
  AuthRealm.Workspace,
  AuthRealm.Portal,
] as const;

export const WORKSPACE_REALM_VALUES = [AuthRealm.Workspace] as const;
