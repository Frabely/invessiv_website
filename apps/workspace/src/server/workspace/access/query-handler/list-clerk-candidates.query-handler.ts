import "server-only";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { ListClerkCandidatesRequestDto } from "@invessiv/common/contracts/auth/list-clerk-candidates-request.dto";
import type { ListClerkCandidatesResult } from "@invessiv/common/contracts/auth/results/list-clerk-candidates-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";

/** Clerk accounts without a `users` row. Linked accounts are filtered by Clerk id, never by email. */
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

  const linkedRows = await getDrizzleDatabaseClient()
    .select({ clerkUserId: users.clerk_user_id })
    .from(users);
  const linked = new Set(linkedRows.map((row) => row.clerkUserId));
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
    })),
  };
}
