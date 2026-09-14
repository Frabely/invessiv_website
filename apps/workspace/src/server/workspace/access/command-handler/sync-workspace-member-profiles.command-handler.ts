import "server-only";

import { eq } from "drizzle-orm";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { users, workspaceMembers } from "@invessiv/db/record-configuration";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { clerkDirectoryService } from "@/server/workspace/access/services/clerk-directory-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

async function refreshProfiles(): Promise<void> {
  const db = getDrizzleDatabaseClient();
  const linkedUsers = await db
    .select({
      id: users.id,
      clerk_user_id: users.clerk_user_id,
      primary_email: users.primary_email,
      first_name: users.first_name,
      last_name: users.last_name,
      display_name: users.display_name,
      version: users.version,
    })
    .from(users)
    .innerJoin(workspaceMembers, eq(workspaceMembers.user_id, users.id));

  if (linkedUsers.length === 0) {
    return;
  }

  const lookup = await clerkDirectoryService.listProfilesByIds(
    linkedUsers.map((user) => user.clerk_user_id),
  );
  if (!lookup.ok) {
    return;
  }

  const profiles = new Map(
    lookup.profiles.map((profile) => [profile.clerkUserId, profile]),
  );
  const changes = linkedUsers.flatMap((user) => {
    const profile = profiles.get(user.clerk_user_id);
    if (!profile) {
      return [];
    }
    // `users.primary_email` is mandatory, so a Clerk account without one keeps the stored address.
    const primaryEmail = profile.primaryEmail ?? user.primary_email;
    const changed =
      primaryEmail !== user.primary_email ||
      profile.firstName !== user.first_name ||
      profile.lastName !== user.last_name ||
      profile.displayName !== user.display_name;
    return changed ? [{ user, profile, primaryEmail }] : [];
  });

  if (changes.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    for (const { user, profile, primaryEmail } of changes) {
      await updateVersioned({
        tx,
        table: users,
        id: user.id,
        expectedVersion: user.version,
        patch: {
          primary_email: primaryEmail,
          first_name: profile.firstName,
          last_name: profile.lastName,
          display_name: profile.displayName,
        },
        toDto: (row) => row.id,
      });
    }
  });
}

/**
 * Refreshes names and emails of all members from Clerk after the member list was sent, so the
 * next render shows them. A Clerk outage only skips the refresh; a lost version race is retried
 * on the next render.
 */
export async function syncWorkspaceMemberProfiles(): Promise<void> {
  try {
    await refreshProfiles();
  } catch (error: unknown) {
    // Nothing awaits this after the response; an unhandled rejection would log driver messages
    // that can contain row data such as email addresses.
    logAccessFailure(AccessOperation.SyncMemberProfiles, error);
  }
}
