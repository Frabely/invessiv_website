/** Rights for one kind of access, resolved per scope on the server with `canOn`. */
export type CrmScopeRights = {
  customerWide: boolean;
  projectIds: readonly string[];
};
