import { z } from "zod";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { PERMISSION_VALUES } from "@invessiv/common/constants/auth/permissions";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";

function hasNoDuplicates(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const versionSchema = z.int().positive();

const roleIdsSchema = z
  .array(z.uuid())
  .max(AccessFieldLimits.AssignedRoleIdsMax)
  .refine(hasNoDuplicates, { message: "Role ids must be unique" });

// Delegability is deliberately not checked here: the handlers answer it with its own error code.
const workspacePermissionsSchema = z
  .array(z.enum(PERMISSION_VALUES))
  .refine(hasNoDuplicates, { message: "Permissions must be unique" })
  .refine(
    (permissions) =>
      permissions.every(
        (permission) =>
          PERMISSION_DEFINITIONS[permission].realm === AuthRealm.Workspace,
      ),
    { message: "Only workspace permissions can be assigned" },
  );

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

export const accessSchemas = {
  entityId: z.uuid(),
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
  changeWorkspaceOwner: z.object({
    version: versionSchema,
  }),
  createRole: z.object({
    name: roleNameSchema,
    description: roleDescriptionSchema,
    permissions: workspacePermissionsSchema,
  }),
  updateRole: z.object({
    name: roleNameSchema,
    description: roleDescriptionSchema,
    active: z.boolean(),
    permissions: workspacePermissionsSchema,
    version: versionSchema,
  }),
} as const;
