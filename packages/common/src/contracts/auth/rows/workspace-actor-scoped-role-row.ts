/** One permission obtained through an active role bound to a customer or project. */
export type WorkspaceActorScopedRoleRow = {
  workspace_member_id: string;
  customer_id: string;
  project_id: string | null;
  permission_key: string | null;
  permission_scope_assignable: boolean | null;
};
