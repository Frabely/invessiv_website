import "server-only";

import { and, eq, inArray, isNull, type SQL } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalInvitations,
} from "@invessiv/db/record-configuration";

async function revokeOpen(
  tx: ContactDatabaseTransaction,
  assignmentCondition: SQL,
  now: Date,
): Promise<void> {
  await tx
    .update(portalInvitations)
    .set({ revoked_at: now, updated_at: now })
    .where(
      and(
        assignmentCondition,
        isNull(portalInvitations.redeemed_at),
        isNull(portalInvitations.revoked_at),
      ),
    );
}

async function forAssignment(
  tx: ContactDatabaseTransaction,
  assignmentId: string,
  now: Date,
): Promise<void> {
  await revokeOpen(tx, eq(portalInvitations.assignment_id, assignmentId), now);
}

async function forCustomerPerson(
  tx: ContactDatabaseTransaction,
  customerId: string,
  personId: string,
  now: Date,
): Promise<void> {
  const assignments = tx
    .select({ id: customerContactAssignments.id })
    .from(customerContactAssignments)
    .where(
      and(
        eq(customerContactAssignments.customer_id, customerId),
        eq(customerContactAssignments.person_id, personId),
      ),
    );
  await revokeOpen(
    tx,
    inArray(portalInvitations.assignment_id, assignments),
    now,
  );
}

export const portalInvitationRevocationService = {
  forAssignment,
  forCustomerPerson,
} as const;
