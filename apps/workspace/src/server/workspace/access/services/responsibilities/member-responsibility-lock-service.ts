import "server-only";

import { eq } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { workspaceMembers } from "@invessiv/db/record-configuration";

/**
 * Serializes "assign a responsibility" against "deactivate the member". The foreign key
 * alone takes only `FOR KEY SHARE`, which conflicts with neither lock below — without these
 * a customer could be assigned between the responsibility count and the deactivation commit.
 */
async function lockMemberForDeactivation(
  tx: ContactDatabaseTransaction,
  memberId: string,
): Promise<void> {
  await tx
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId))
    .for("update");
}

/** Holds the membership until commit; a waiting deactivation then counts the new responsibility. */
async function lockActiveMemberForAssignment(
  tx: ContactDatabaseTransaction,
  memberId: string,
): Promise<boolean> {
  const [member] = await tx
    .select({ active: workspaceMembers.active })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId))
    .for("share");

  return member?.active;
}

export const memberResponsibilityLockService = {
  lockActiveMemberForAssignment,
  lockMemberForDeactivation,
} as const;
