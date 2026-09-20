import "server-only";

import { asc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import {
  customers,
  projects,
  roles,
  users,
  workspaceMembers,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { accessScopeEntryMappingService } from "@/server/workspace/access/services/access-scope-entry-mapping-service";

/**
 * Loads the grants matching `condition`, joined with the names a list shows. Ordered so a tree
 * can be built by walking the rows once: customers by name, the customer-level grants before the
 * project grants, then people and roles. Every tie ends on an id, so the order never flips
 * between two renders.
 */
async function load(
  executor: AccessDatabaseExecutor,
  condition: SQL,
): Promise<AccessScopeEntryDto[]> {
  const rows = await executor
    .select({
      id: workspaceMemberScopedRoles.id,
      workspace_member_id: workspaceMemberScopedRoles.workspace_member_id,
      member_display_name: users.display_name,
      role_id: workspaceMemberScopedRoles.role_id,
      role_name: roles.name,
      role_system_key: roles.system_key,
      role_active: roles.active,
      customer_id: workspaceMemberScopedRoles.customer_id,
      customer_number: customers.customer_number,
      customer_display_name: customers.display_name,
      project_id: workspaceMemberScopedRoles.project_id,
      project_title: projects.title,
      assigned_by_user_id: workspaceMemberScopedRoles.assigned_by_user_id,
      assigned_at: workspaceMemberScopedRoles.assigned_at,
    })
    .from(workspaceMemberScopedRoles)
    .innerJoin(
      workspaceMembers,
      eq(workspaceMembers.id, workspaceMemberScopedRoles.workspace_member_id),
    )
    .innerJoin(users, eq(users.id, workspaceMembers.user_id))
    .innerJoin(roles, eq(roles.id, workspaceMemberScopedRoles.role_id))
    .innerJoin(
      customers,
      eq(customers.id, workspaceMemberScopedRoles.customer_id),
    )
    .leftJoin(projects, eq(projects.id, workspaceMemberScopedRoles.project_id))
    .where(condition)
    .orderBy(
      asc(customers.display_name),
      asc(customers.id),
      asc(isNotNull(workspaceMemberScopedRoles.project_id)),
      asc(projects.title),
      asc(projects.id),
      asc(users.display_name),
      asc(roles.name),
      asc(workspaceMemberScopedRoles.id),
    );

  return rows.map(accessScopeEntryMappingService.mapRow);
}

async function listByMember(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<AccessScopeEntryDto[]> {
  return load(
    executor,
    eq(workspaceMemberScopedRoles.workspace_member_id, memberId),
  );
}

/** Batched sibling of `listByMember` for a list of members, e.g. a whole members page. */
async function listByMembers(
  executor: AccessDatabaseExecutor,
  memberIds: readonly string[],
): Promise<AccessScopeEntryDto[]> {
  if (memberIds.length === 0) {
    return [];
  }
  return load(
    executor,
    inArray(workspaceMemberScopedRoles.workspace_member_id, memberIds),
  );
}

async function listByCustomer(
  executor: AccessDatabaseExecutor,
  customerId: string,
): Promise<AccessScopeEntryDto[]> {
  return load(executor, eq(workspaceMemberScopedRoles.customer_id, customerId));
}

export const accessScopeReadService = {
  listByCustomer,
  listByMember,
  listByMembers,
} as const;
