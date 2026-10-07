/** Rights for one kind of access, resolved per scope on the server with `canOn`. */
export type CredentialsScopeRights = {
  customerWide: boolean;
  projectIds: readonly string[];
};
