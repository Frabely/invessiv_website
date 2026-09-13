export const BootstrapWorkspaceOwnerError = {
  AlreadyInitialized: "already_initialized",
  IdentityMismatch: "identity_mismatch",
} as const;

export type BootstrapWorkspaceOwnerError =
  (typeof BootstrapWorkspaceOwnerError)[keyof typeof BootstrapWorkspaceOwnerError];

export const BOOTSTRAP_WORKSPACE_OWNER_ERROR_VALUES = [
  BootstrapWorkspaceOwnerError.AlreadyInitialized,
  BootstrapWorkspaceOwnerError.IdentityMismatch,
] as const;
