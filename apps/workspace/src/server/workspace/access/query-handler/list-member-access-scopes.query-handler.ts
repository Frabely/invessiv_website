import "server-only";

import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { accessScopeReadService } from "@/server/workspace/access/services/access-scope-read-service";

export async function listMemberAccessScopes(
  memberId: string,
): Promise<AccessScopeEntryDto[]> {
  const db = getDrizzleDatabaseClient();
  return accessScopeReadService.listByMember(db, memberId);
}

/**
 * Batched sibling of `listMemberAccessScopes` for a whole member list (e.g. the Settings members
 * page), one query instead of one per member. Every requested id gets an entry, empty if the
 * member holds no scoped grant.
 */
export async function listMemberAccessScopesForMembers(
  memberIds: readonly string[],
): Promise<Record<string, AccessScopeEntryDto[]>> {
  const db = getDrizzleDatabaseClient();
  const entries = await accessScopeReadService.listByMembers(db, memberIds);
  const byMember: Record<string, AccessScopeEntryDto[]> = Object.fromEntries(
    memberIds.map((memberId) => [memberId, []]),
  );
  for (const entry of entries) {
    byMember[entry.workspaceMemberId]?.push(entry);
  }
  return byMember;
}
