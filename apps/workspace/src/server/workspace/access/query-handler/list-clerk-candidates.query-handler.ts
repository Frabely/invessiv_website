import "server-only";

import { eq, isNull } from "drizzle-orm";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { ListClerkCandidatesRequestDto } from "@invessiv/common/contracts/auth/list-clerk-candidates-request.dto";
import type { ListClerkCandidatesResult } from "@invessiv/common/contracts/auth/results/list-clerk-candidates-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  portalMemberships,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";

type AccessDatabaseExecutor = Pick<ContactDatabaseTransaction, "select">;

/** Already an internal member — excluded from the candidate list. */
async function listLinkedClerkUserIds(
  executor: AccessDatabaseExecutor,
): Promise<string[]> {
  const rows = await executor
    .select({ clerk_user_id: users.clerk_user_id })
    .from(users)
    .innerJoin(workspaceMembers, eq(workspaceMembers.user_id, users.id));

  return rows.map((row) => row.clerk_user_id);
}

/** Active portal members remain candidates and are visibly marked before adding. */
async function listPortalLinkedClerkUserIds(
  executor: AccessDatabaseExecutor,
): Promise<string[]> {
  const rows = await executor
    .select({ clerk_user_id: users.clerk_user_id })
    .from(users)
    .innerJoin(portalMemberships, eq(portalMemberships.user_id, users.id))
    .where(isNull(portalMemberships.revoked_at));

  return rows.map((row) => row.clerk_user_id);
}

/**
 * Clerk accounts without a `workspace_members` row — a `users` row alone (a portal-only account,
 * Ordner 12b) does not disqualify. Linked accounts are filtered by Clerk id, never by email.
 */
export async function listClerkCandidates(
  input: ListClerkCandidatesRequestDto,
): Promise<ListClerkCandidatesResult> {
  const validation = accessSchemas.listClerkCandidates.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const db = getDrizzleDatabaseClient();
  const [linkedIds, portalLinkedIds] = await Promise.all([
    listLinkedClerkUserIds(db),
    listPortalLinkedClerkUserIds(db),
  ]);
  const linked = new Set(linkedIds);
  const portalLinked = new Set(portalLinkedIds);

  const lookup = await clerkDirectoryService.listCandidateProfiles(
    validation.data.query || null,
    linked,
  );
  if (!lookup.ok) {
    return lookup;
  }

  return {
    ok: true,
    candidates: lookup.profiles.map((profile) => ({
      clerkUserId: profile.clerkUserId,
      displayName: profile.displayName,
      primaryEmail: profile.primaryEmail,
      hasPortalMembership: portalLinked.has(profile.clerkUserId),
    })),
  };
}
