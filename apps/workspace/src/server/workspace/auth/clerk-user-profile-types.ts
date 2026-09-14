/** Master data of a Clerk account as the workspace copies it into `users`. Never authorizes. */
export interface ClerkUserProfile {
  clerkUserId: string;
  /** Null when the Clerk account has no primary address; such an account cannot be linked. */
  primaryEmail: string | null;
  firstName: string | null;
  lastName: string | null;
  /** Full name, falling back to the primary email and finally the Clerk id. */
  displayName: string;
}
