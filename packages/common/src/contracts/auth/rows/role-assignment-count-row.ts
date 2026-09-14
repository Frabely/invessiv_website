/** Number of memberships per role; roles without any assignment have no row. */
export type RoleAssignmentCountRow = {
  role_id: string;
  assigned_member_count: number;
};
