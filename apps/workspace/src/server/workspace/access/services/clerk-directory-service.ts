import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type {
  ClerkProfileListResult,
  ClerkProfileLookupResult,
} from "@/server/workspace/access/access-types";
import type { ClerkUserProfile } from "@/server/workspace/auth/clerk-user-profile-types";
import { clerkUserProfileMappingService } from "@/server/workspace/auth/services/clerk-user-profile-mapping-service";

const CANDIDATE_LIMIT = 100;
// Clerk caps a user list page at 500 entries.
const PROFILE_BATCH_LIMIT = 500;

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === HttpResponseCode.NotFound
  );
}

function logFailure(operation: string, error: unknown): void {
  console.error("[workspace-access] clerk directory request failed", {
    operation,
    errorName: error instanceof Error ? error.name : typeof error,
  });
}

async function findProfile(
  clerkUserId: string,
): Promise<ClerkProfileLookupResult> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    return {
      ok: true,
      profile: clerkUserProfileMappingService.mapUserToProfile(user),
    };
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return { ok: false, code: WorkspaceMemberErrorCode.ClerkAccountNotFound };
    }
    logFailure("findProfile", error);
    return { ok: false, code: WorkspaceMemberErrorCode.ClerkUnavailable };
  }
}

async function listCandidateProfiles(
  query: string | null,
  excludedClerkUserIds: ReadonlySet<string>,
): Promise<ClerkProfileListResult> {
  try {
    const client = await clerkClient();
    const profiles: ClerkUserProfile[] = [];
    let offset = 0;

    while (profiles.length < CANDIDATE_LIMIT) {
      const page = await client.users.getUserList({
        limit: CANDIDATE_LIMIT,
        offset,
        orderBy: "-created_at",
        ...(query ? { query } : {}),
      });
      const availableProfiles = page.data
        .map(clerkUserProfileMappingService.mapUserToProfile)
        .filter((profile) => !excludedClerkUserIds.has(profile.clerkUserId));
      profiles.push(
        ...availableProfiles.slice(0, CANDIDATE_LIMIT - profiles.length),
      );
      offset += page.data.length;

      if (page.data.length === 0 || offset >= page.totalCount) {
        break;
      }
    }

    return { ok: true, profiles };
  } catch (error: unknown) {
    logFailure("listCandidateProfiles", error);
    return { ok: false, code: WorkspaceMemberErrorCode.ClerkUnavailable };
  }
}

async function listProfilesByIds(
  clerkUserIds: readonly string[],
): Promise<ClerkProfileListResult> {
  if (clerkUserIds.length === 0) {
    return { ok: true, profiles: [] };
  }

  try {
    const client = await clerkClient();
    const profiles: ClerkUserProfile[] = [];
    for (
      let start = 0;
      start < clerkUserIds.length;
      start += PROFILE_BATCH_LIMIT
    ) {
      const page = await client.users.getUserList({
        userId: clerkUserIds.slice(start, start + PROFILE_BATCH_LIMIT),
        limit: PROFILE_BATCH_LIMIT,
      });
      profiles.push(
        ...page.data.map(clerkUserProfileMappingService.mapUserToProfile),
      );
    }
    return { ok: true, profiles };
  } catch (error: unknown) {
    logFailure("listProfilesByIds", error);
    return { ok: false, code: WorkspaceMemberErrorCode.ClerkUnavailable };
  }
}

export const clerkDirectoryService = {
  findProfile,
  listCandidateProfiles,
  listProfilesByIds,
} as const;
