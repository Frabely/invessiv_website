/** Body of `POST /api/workspace/members`. */
export interface AddWorkspaceMemberRequestDto {
  /** Clerk account to link. Name and email are loaded server-side and never accepted here. */
  clerkUserId: string;
  /**
   * At least one non-owner workspace role. The owner role is rejected; it is granted only
   * through the owner flow after the member exists.
   */
  roleIds: string[];
}
