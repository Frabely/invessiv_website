/** A Clerk account that is not yet linked to any `users` row. */
export interface ClerkCandidateDto {
  /**
   * The only value sent back when adding the member. The server reloads name and email from
   * Clerk by this id, so a manipulated display value can never become master data.
   */
  clerkUserId: string;
  /** Full name from Clerk, falling back to the primary email when no name is set. */
  displayName: string;
  /**
   * Primary email from Clerk for recognizing the account in the picker. Null when Clerk has no
   * primary address; such an account cannot be added until it has one.
   */
  primaryEmail: string | null;
}
