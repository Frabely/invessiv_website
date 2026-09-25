import "server-only";

import { eq } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export type ClerkProfileForUserSync = {
  clerkUserId: string;
  primaryEmail: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
};

type SyncedUser = { id: string; active: boolean };

/**
 * Ensures a `users` row exists for this Clerk identity and that its master data matches Clerk,
 * locking the row for the rest of the caller's transaction. Both the workspace-member and the
 * portal-invitation flow can be the first to see a given identity, so this lives here instead of
 * being duplicated per flow with its own locking and sync semantics.
 *
 * Never flips `active` on an existing row unless `activate` is set — a portal-only account that
 * was deactivated must stay inactive through a plain profile sync (e.g. redeeming another
 * invitation); only a flow that is deliberately granting access (adding a workspace member)
 * passes `activate: true`.
 */
async function ensureUser(
  tx: ContactDatabaseTransaction,
  profile: ClerkProfileForUserSync,
  now: Date,
  options?: { activate?: boolean },
): Promise<SyncedUser> {
  const existingRows = await tx
    .select()
    .from(users)
    .where(eq(users.clerk_user_id, profile.clerkUserId))
    .for("update");
  const existing = existingRows[0] ?? null;

  if (!existing) {
    const id = crypto.randomUUID();
    await tx.insert(users).values({
      id,
      clerk_user_id: profile.clerkUserId,
      primary_email: profile.primaryEmail,
      first_name: profile.firstName,
      last_name: profile.lastName,
      display_name: profile.displayName,
      active: true,
      version: 1,
      created_at: now,
      updated_at: now,
    });
    return { id, active: true };
  }

  const sync = await updateVersioned({
    tx,
    table: users,
    id: existing.id,
    expectedVersion: existing.version,
    patch: {
      primary_email: profile.primaryEmail,
      first_name: profile.firstName,
      last_name: profile.lastName,
      display_name: profile.displayName,
      ...(options?.activate ? { active: true } : {}),
    },
    toDto: (row): SyncedUser => ({ id: row.id, active: row.active }),
  });
  if (!sync.ok) {
    // The `for("update")` lock above holds this row for the rest of the transaction, so
    // neither a version conflict nor a vanished row can happen under normal operation.
    throw new Error(
      `Failed to sync master data for locked user row ${existing.id}: ${sync.code}`,
    );
  }
  return sync.value;
}

export const clerkUserService = { ensureUser } as const;
