import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { resolveCustomerContactDisplayName } from "@invessiv/common/patterns/crm/customer-contact-display-name";
import type { CustomerContactAssignmentDto } from "@invessiv/common/contracts/crm/customer-contact.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  people,
} from "@invessiv/db/record-configuration";
import type { ValidatedUpdateCustomerInput } from "@/server/workspace/crm/crm-types";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

class CustomerContactWriteConflictError extends Error {}

type ContactWrites = NonNullable<ValidatedUpdateCustomerInput["contacts"]>;

function hasPersonChanges(
  contact: ContactWrites[number],
  current: CustomerContactAssignmentDto,
) {
  return (
    resolveCustomerContactDisplayName(contact) !== current.displayName ||
    contact.firstName !== current.firstName ||
    contact.lastName !== current.lastName ||
    contact.email !== current.primaryEmail ||
    contact.phone !== current.primaryPhone ||
    contact.preferredLocale !== current.preferredLocale
  );
}

function hasAssignmentChanges(
  contact: ContactWrites[number],
  current: CustomerContactAssignmentDto,
) {
  return (
    contact.isPrimary !== current.isPrimary ||
    contact.roleLabel !== current.roleLabel
  );
}

function collectRequestedExistingContactIds(
  contacts: ContactWrites,
): Set<string> {
  const ids = contacts.flatMap((contact) => (contact.id ? [contact.id] : []));
  if (new Set(ids).size !== ids.length) {
    throw new CustomerContactWriteConflictError();
  }
  return new Set(ids);
}

async function deleteAssignmentIfVersionMatches(
  tx: ContactDatabaseTransaction,
  assignmentId: string,
  version: number,
) {
  const deleted = await tx
    .delete(customerContactAssignments)
    .where(
      and(
        eq(customerContactAssignments.id, assignmentId),
        eq(customerContactAssignments.version, version),
      ),
    )
    .returning({ id: customerContactAssignments.id });
  if (deleted.length !== 1) throw new CustomerContactWriteConflictError();
}

async function removeOrDemoteCurrentPrimary(
  tx: ContactDatabaseTransaction,
  currentPrimary: { id: string; assignmentVersion: number },
  requestedPrimaryId: string | undefined,
  requestedContacts: ContactWrites,
): Promise<Set<string>> {
  const deletedIds = new Set<string>();
  if (requestedPrimaryId === currentPrimary.id) return deletedIds;
  const retained = requestedContacts.find(
    (contact) => contact.id === currentPrimary.id,
  );
  if (!retained) {
    await deleteAssignmentIfVersionMatches(
      tx,
      currentPrimary.id,
      currentPrimary.assignmentVersion,
    );
    deletedIds.add(currentPrimary.id);
    return deletedIds;
  }
  const write = await updateVersioned({
    tx,
    table: customerContactAssignments,
    id: currentPrimary.id,
    expectedVersion: retained.assignmentVersion!,
    patch: { is_primary: false },
    toDto: (row) => row.id,
  });
  if (!write.ok) throw new CustomerContactWriteConflictError();
  return deletedIds;
}

async function synchronizeExistingContactWrites(
  tx: ContactDatabaseTransaction,
  contacts: ContactWrites,
  currentById: Map<string, CustomerContactAssignmentDto>,
  currentPrimaryId: string | undefined,
  requestedPrimaryId: string | undefined,
) {
  for (const contact of contacts.filter((entry) => entry.id)) {
    const existing = currentById.get(contact.id!);
    if (!existing || existing.personId !== contact.personId)
      throw new CustomerContactWriteConflictError();
    if (hasPersonChanges(contact, existing)) {
      const personWrite = await updateVersioned({
        tx,
        table: people,
        id: contact.personId!,
        expectedVersion: contact.personVersion!,
        patch: {
          display_name: resolveCustomerContactDisplayName(contact),
          first_name: contact.firstName,
          last_name: contact.lastName,
          primary_email: contact.email,
          primary_phone: contact.phone,
          preferred_locale: contact.preferredLocale,
        },
        toDto: (row) => row.id,
      });
      if (!personWrite.ok) throw new CustomerContactWriteConflictError();
    }
    if (hasAssignmentChanges(contact, existing)) {
      const assignmentWrite = await updateVersioned({
        tx,
        table: customerContactAssignments,
        id: contact.id!,
        expectedVersion:
          currentPrimaryId === contact.id && requestedPrimaryId !== contact.id
            ? contact.assignmentVersion! + 1
            : contact.assignmentVersion!,
        patch: { is_primary: contact.isPrimary, role_label: contact.roleLabel },
        toDto: (row) => row.id,
      });
      if (!assignmentWrite.ok) throw new CustomerContactWriteConflictError();
    }
  }
}

async function createNewContactAssignments(
  tx: ContactDatabaseTransaction,
  customerId: string,
  contacts: ContactWrites,
) {
  for (const contact of contacts.filter((entry) => !entry.id)) {
    const personId = randomUUID();
    await tx.insert(people).values({
      id: personId,
      display_name: resolveCustomerContactDisplayName(contact),
      first_name: contact.firstName,
      last_name: contact.lastName,
      primary_email: contact.email,
      primary_phone: contact.phone,
      preferred_locale: contact.preferredLocale,
      notes: null,
      version: 1,
    });
    await tx.insert(customerContactAssignments).values({
      id: randomUUID(),
      customer_id: customerId,
      person_id: personId,
      role_label: contact.roleLabel,
      business_email: null,
      business_phone: null,
      is_primary: contact.isPrimary,
      version: 1,
    });
  }
}

async function deleteOmittedContactAssignments(
  tx: ContactDatabaseTransaction,
  current: NonNullable<
    Awaited<ReturnType<typeof customerReadService.findDetailById>>
  >,
  retainedIds: Set<string>,
  deletedIds: Set<string>,
) {
  for (const contact of current.contacts) {
    if (retainedIds.has(contact.id) || deletedIds.has(contact.id)) continue;
    await deleteAssignmentIfVersionMatches(
      tx,
      contact.id,
      contact.assignmentVersion,
    );
  }
}

async function synchronizeCustomerContacts(
  tx: ContactDatabaseTransaction,
  customerId: string,
  contacts: ContactWrites,
) {
  const current = await customerReadService.findDetailById(tx, customerId);
  if (!current) throw new CustomerContactWriteConflictError();
  const retainedIds = collectRequestedExistingContactIds(contacts);
  const currentById = new Map(
    current.contacts.map((contact) => [contact.id, contact]),
  );
  if ([...retainedIds].some((id) => !currentById.has(id)))
    throw new CustomerContactWriteConflictError();

  const currentPrimary = current.contacts.find((contact) => contact.isPrimary);
  const requestedPrimary = contacts.find((contact) => contact.isPrimary);
  const deletedIds = currentPrimary
    ? await removeOrDemoteCurrentPrimary(
        tx,
        currentPrimary,
        requestedPrimary?.id,
        contacts,
      )
    : new Set<string>();
  await synchronizeExistingContactWrites(
    tx,
    contacts,
    currentById,
    currentPrimary?.id,
    requestedPrimary?.id,
  );
  await createNewContactAssignments(tx, customerId, contacts);
  await deleteOmittedContactAssignments(tx, current, retainedIds, deletedIds);
}

function isContactWriteConflict(error: unknown) {
  return error instanceof CustomerContactWriteConflictError;
}

export const customerContactWriteService = {
  synchronizeCustomerContacts,
  isContactWriteConflict,
} as const;
