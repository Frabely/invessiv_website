import "server-only";

import { inArray } from "drizzle-orm";

import type { ListClerkCandidatesResult } from "@invessiv/common/contracts/auth/results/list-clerk-candidates-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";

/** Clerk accounts without a `users` row. Linked accounts are filtered by Clerk id, never by email. */
export async function listClerkCandidates(
  query: string | null,
): Promise<ListClerkCandidatesResult> {
  const lookup = await clerkDirectoryService.listCandidateProfiles(query);
  if (!lookup.ok) {
    return lookup;
  }

  const clerkUserIds = lookup.profiles.map((profile) => profile.clerkUserId);
  const linkedRows =
    clerkUserIds.length > 0
      ? await getDrizzleDatabaseClient()
          .select({ clerkUserId: users.clerk_user_id })
          .from(users)
          .where(inArray(users.clerk_user_id, clerkUserIds))
      : [];
  const linked = new Set(linkedRows.map((row) => row.clerkUserId));

  return {
    ok: true,
    candidates: lookup.profiles
      .filter((profile) => !linked.has(profile.clerkUserId))
      .map((profile) => ({
        clerkUserId: profile.clerkUserId,
        displayName: profile.displayName,
        primaryEmail: profile.primaryEmail,
      })),
  };
}
