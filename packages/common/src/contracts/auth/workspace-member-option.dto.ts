/**
 * An active member as offered in pickers of other areas, e.g. when choosing who is responsible.
 * Deliberately without email, roles or owner status: `members.read` is part of the everyday
 * member role, while the full `WorkspaceMemberDto` stays with the settings area.
 */
export interface WorkspaceMemberOptionDto {
  /** `workspace_members.id`; references such as a responsible member store this id. */
  id: string;
  /** Copied from Clerk and the only visible label. Never used to find or authorize a member. */
  displayName: string;
}
