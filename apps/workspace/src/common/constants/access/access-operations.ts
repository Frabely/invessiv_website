/** Stable operation names for access route logs; never contain ids, names or emails. */
export const AccessOperation = {
  ListMembers: "members.list",
  AddMember: "members.add",
  UpdateMemberStatus: "members.status.update",
  ListClerkCandidates: "members.clerk_candidates",
  ReplaceMemberRoles: "members.roles.replace",
  ReplaceMemberRoleAssignments: "members.role_assignments.replace",
  GrantOwner: "members.owner.grant",
  RevokeOwner: "members.owner.revoke",
  ListMemberAccessScopes: "members.access_scopes.list",
  GrantMemberAccessScope: "members.access_scopes.grant",
  ReplaceMemberAccessScopes: "members.access_scopes.replace",
  RevokeMemberAccessScope: "members.access_scopes.revoke",
  ListCustomerAccessScopes: "customers.access_scopes.list",
  ListAccessCustomers: "access.customers.list",
  ListAccessCustomerProjects: "access.customers.projects.list",
  SyncMemberProfiles: "members.profiles.sync",
  ListRoles: "roles.list",
  CreateRole: "roles.create",
  UpdateRole: "roles.update",
} as const;

export type AccessOperation =
  (typeof AccessOperation)[keyof typeof AccessOperation];

export const ACCESS_OPERATION_VALUES = [
  AccessOperation.ListMembers,
  AccessOperation.AddMember,
  AccessOperation.UpdateMemberStatus,
  AccessOperation.ListClerkCandidates,
  AccessOperation.ReplaceMemberRoles,
  AccessOperation.ReplaceMemberRoleAssignments,
  AccessOperation.GrantOwner,
  AccessOperation.RevokeOwner,
  AccessOperation.ListMemberAccessScopes,
  AccessOperation.GrantMemberAccessScope,
  AccessOperation.ReplaceMemberAccessScopes,
  AccessOperation.RevokeMemberAccessScope,
  AccessOperation.ListCustomerAccessScopes,
  AccessOperation.ListAccessCustomers,
  AccessOperation.ListAccessCustomerProjects,
  AccessOperation.SyncMemberProfiles,
  AccessOperation.ListRoles,
  AccessOperation.CreateRole,
  AccessOperation.UpdateRole,
] as const;
