/** Rights for one kind of access, resolved per scope on the server with `canOn`. */
export type FilesScopeRights = {
  customerWide: boolean;
  projectIds: readonly string[];
};
