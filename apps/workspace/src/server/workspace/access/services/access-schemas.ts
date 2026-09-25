import { z } from "zod";

import {
  AUTH_REALM_VALUES,
  AuthRealm,
} from "@invessiv/common/constants/auth/auth-realms";
import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { PERMISSION_VALUES } from "@invessiv/common/constants/auth/permissions";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { accessScopeAssignmentKey } from "@/common/patterns/access/access-scope-tree";

function hasNoDuplicates(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const versionSchema = z.int().positive();
const accessScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(AccessScopeType.Customer), customerId: z.uuid() }),
  z.object({
    type: z.literal(AccessScopeType.Project),
    customerId: z.uuid(),
    projectId: z.uuid(),
  }),
]);

const accessScopeAssignmentSchema = z.object({
  roleId: z.uuid(),
  scope: accessScopeSchema,
});

const roleIdsSchema = z
  .array(z.uuid())
  .max(AccessFieldLimits.AssignedRoleIdsMax)
  .refine(hasNoDuplicates, { message: "Role ids must be unique" });

const roleNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(AccessFieldLimits.RoleNameMaxLength);

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(AccessFieldLimits.RoleDescriptionMaxLength)
  .nullable()
  .transform((value) => (value ? value : null));

const clerkCandidateQuerySchema = z
  .string()
  .trim()
  .max(AccessFieldLimits.ClerkCandidateQueryMaxLength);

const accessLookupSearchSchema = z
  .string()
  .trim()
  .max(AccessFieldLimits.AccessLookupQueryMaxLength)
  .default("");

export const accessSchemas = {
  entityId: z.uuid(),
  listAccessCustomers: z.object({ search: accessLookupSearchSchema }),
  listClerkCandidates: z.object({
    query: clerkCandidateQuerySchema,
  }),
  addWorkspaceMember: z.object({
    clerkUserId: z
      .string()
      .trim()
      .min(1)
      .max(AccessFieldLimits.ClerkUserIdMaxLength),
    roleIds: roleIdsSchema,
  }),
  replaceWorkspaceMemberRoles: z.object({
    roleIds: roleIdsSchema,
    version: versionSchema,
  }),
  replaceMemberRoleAssignments: z.object({
    roleIds: roleIdsSchema,
    accessScopeAssignments: z
      .array(accessScopeAssignmentSchema)
      .max(AccessFieldLimits.AccessScopeAssignmentsMax)
      .refine(
        (assignments) =>
          hasNoDuplicates(assignments.map(accessScopeAssignmentKey)),
        { message: "Access scope assignments must be unique" },
      ),
    version: versionSchema,
  }),
  changeWorkspaceOwner: z.object({
    version: versionSchema,
  }),
  updateWorkspaceMemberStatus: z.object({
    active: z.boolean(),
    version: versionSchema,
  }),
  createRole: z.object({
    realm: z.enum(AUTH_REALM_VALUES).default(AuthRealm.Workspace),
    scopeAssignable: z.boolean(),
    name: roleNameSchema,
    description: roleDescriptionSchema,
    permissions: z.array(z.enum(PERMISSION_VALUES)).refine(hasNoDuplicates),
  }),
  updateRole: z
    .object({
      name: roleNameSchema,
      description: roleDescriptionSchema,
      active: z.boolean(),
      permissions: z.array(z.enum(PERMISSION_VALUES)).refine(hasNoDuplicates),
      version: versionSchema,
    })
    .strict(),
  grantAccessScope: z.object({
    roleId: z.uuid(),
    scope: accessScopeSchema,
    version: versionSchema,
  }),
  replaceAccessScopes: z.object({
    assignments: z
      .array(accessScopeAssignmentSchema)
      .max(AccessFieldLimits.AccessScopeAssignmentsMax)
      .refine(
        (assignments) =>
          hasNoDuplicates(assignments.map(accessScopeAssignmentKey)),
        { message: "Access scope assignments must be unique" },
      ),
    version: versionSchema,
  }),
  revokeAccessScope: z.object({ version: versionSchema }),
} as const;
