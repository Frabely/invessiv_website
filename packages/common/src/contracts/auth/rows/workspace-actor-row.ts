/** One row per granted permission; role and permission columns are null without an active assignment. */
export type WorkspaceActorRow = {
  user_id: string;
  user_active: boolean;
  workspace_member_id: string | null;
  member_active: boolean | null;
  permission_key: string | null;
};
