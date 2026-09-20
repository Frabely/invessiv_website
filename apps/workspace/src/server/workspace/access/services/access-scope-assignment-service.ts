import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { AccessScopeAssignmentDto } from "@invessiv/common/contracts/auth/access-scope-assignment.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customers, projects, roles } from "@invessiv/db/record-configuration";

async function validate(
  tx: ContactDatabaseTransaction,
  assignment: AccessScopeAssignmentDto,
) {
  const [role] = await tx
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        eq(roles.id, assignment.roleId),
        eq(roles.realm, AuthRealm.Workspace),
        eq(roles.active, true),
        eq(roles.scope_assignable, true),
      ),
    )
    .limit(1)
    .for("share");
  if (!role) return WorkspaceMemberErrorCode.AccessScopeNotAssignable;

  const [customer] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, assignment.scope.customerId))
    .limit(1);
  if (!customer) return WorkspaceMemberErrorCode.AccessScopeNotFound;

  if (assignment.scope.type === AccessScopeType.Project) {
    const [project] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, assignment.scope.projectId),
          eq(projects.customer_id, assignment.scope.customerId),
        ),
      )
      .limit(1);
    if (!project)
      return WorkspaceMemberErrorCode.AccessScopeProjectCustomerMismatch;
  }

  return null;
}

async function hasActiveRole(
  tx: ContactDatabaseTransaction,
  roleIds: readonly string[],
): Promise<boolean> {
  if (roleIds.length === 0) return false;
  const [role] = await tx
    .select({ id: roles.id })
    .from(roles)
    .where(
      and(
        inArray(roles.id, [...new Set(roleIds)]),
        eq(roles.realm, AuthRealm.Workspace),
        eq(roles.active, true),
        eq(roles.scope_assignable, true),
      ),
    )
    .limit(1);
  return Boolean(role);
}

export const accessScopeAssignmentService = { hasActiveRole, validate };
