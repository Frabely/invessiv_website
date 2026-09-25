export interface ReplacePortalMembershipRolesRequestDto {
  /** Expected membership version for the atomic role replacement. */
  version: number;
  /** Complete replacement set; an empty set cannot revoke portal access. */
  roleIds: string[];
}
