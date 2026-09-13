export interface BootstrapWorkspaceOwnerInput {
  /** Clerk id that matched `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`; the only bootstrap anchor. */
  clerkUserId: string;
  /** Master data copied from Clerk; never used to authorize. */
  primaryEmail: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
}
