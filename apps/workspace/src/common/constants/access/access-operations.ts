/** Stable operation names for access route logs; never contain ids, names or emails. */
export const AccessOperation = {
  ListMembers: "members.list",
  AddMember: "members.add",
  ListClerkCandidates: "members.clerk_candidates",
  ReplaceMemberRoles: "members.roles.replace",
  GrantOwner: "members.owner.grant",
  RevokeOwner: "members.owner.revoke",
  ListRoles: "roles.list",
  CreateRole: "roles.create",
  UpdateRole: "roles.update",
} as const;

export type AccessOperation =
  (typeof AccessOperation)[keyof typeof AccessOperation];

export const ACCESS_OPERATION_VALUES = [
  AccessOperation.ListMembers,
  AccessOperation.AddMember,
  AccessOperation.ListClerkCandidates,
  AccessOperation.ReplaceMemberRoles,
  AccessOperation.GrantOwner,
  AccessOperation.RevokeOwner,
  AccessOperation.ListRoles,
  AccessOperation.CreateRole,
  AccessOperation.UpdateRole,
] as const;
