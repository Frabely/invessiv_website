/** One scoped grant of a member with the activity of its role; feeds the counter and the active flag. */
export type WorkspaceMemberScopedRoleRow = {
  workspace_member_id: string;
  role_active: boolean;
};
