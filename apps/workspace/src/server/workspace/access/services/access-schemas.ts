import { z } from "zod";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { PERMISSION_VALUES } from "@invessiv/common/constants/auth/permissions";

const ROLE_NAME_MAX_LENGTH = 80;
const ROLE_DESCRIPTION_MAX_LENGTH = 280;
const CLERK_USER_ID_MAX_LENGTH = 191;
const MAX_ROLE_IDS = 50;

function hasNoDuplicates(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const versionSchema = z.int().positive();

const roleIdsSchema = z
  .array(z.uuid())
  .max(MAX_ROLE_IDS)
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

const roleNameSchema = z.string().trim().min(1).max(ROLE_NAME_MAX_LENGTH);

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(ROLE_DESCRIPTION_MAX_LENGTH)
  .nullable()
  .transform((value) => (value ? value : null));

export const accessSchemas = {
  entityId: z.uuid(),
  addWorkspaceMember: z.object({
    clerkUserId: z.string().trim().min(1).max(CLERK_USER_ID_MAX_LENGTH),
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
