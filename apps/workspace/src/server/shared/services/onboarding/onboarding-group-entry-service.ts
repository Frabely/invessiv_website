import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { OnboardingGroupEntriesConstraintName } from "@invessiv/db/constraint-names/crm/onboarding-group-entries-constraint-names";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { onboardingGroupEntries } from "@invessiv/db/record-configuration";
import { positionService } from "@/server/shared/services/position-service";
import type {
  OnboardingGroupEntryRow,
  OnboardingGroupEntryWrite,
} from "./onboarding-form-types";

/** The entries of one group field in display order. */
function listOfField(
  executor: ContactDatabaseReader,
  formId: string,
  fieldId: string,
): Promise<OnboardingGroupEntryRow[]> {
  return executor
    .select()
    .from(onboardingGroupEntries)
    .where(
      and(
        eq(onboardingGroupEntries.form_id, formId),
        eq(onboardingGroupEntries.field_id, fieldId),
      ),
    )
    .orderBy(asc(onboardingGroupEntries.position));
}

/** Looked up across all forms: the id comes from the client and may belong to anything. */
async function find(
  executor: ContactDatabaseReader,
  id: string,
): Promise<OnboardingGroupEntryRow | null> {
  const [entry] = await executor
    .select()
    .from(onboardingGroupEntries)
    .where(eq(onboardingGroupEntries.id, id))
    .limit(1);
  return entry ?? null;
}

/**
 * Writes entries at the positions given, as the pre-fill of new blocks does for groups that hold
 * nothing yet. Whether field, form and positions fit decides the caller.
 */
async function insertEntries(
  tx: ContactDatabaseTransaction,
  entries: readonly OnboardingGroupEntryWrite[],
): Promise<void> {
  if (entries.length === 0) return;
  await tx.insert(onboardingGroupEntries).values(
    entries.map((entry) => ({
      id: entry.id,
      form_id: entry.formId,
      field_id: entry.fieldId,
      position: entry.position,
    })),
  );
}

/** Appends behind the last entry. Whether the field is a group of the form decides the caller. */
async function append(
  tx: ContactDatabaseTransaction,
  entry: { id: string; formId: string; fieldId: string },
  position: number,
): Promise<void> {
  await insertEntries(tx, [{ ...entry, position }]);
}

/**
 * Deletes an entry; its answers and file links go with it through the composite foreign keys, the
 * files stay with the customer. The entries behind it move up in one statement, which the
 * deferrable index checks as a whole.
 */
async function remove(
  tx: ContactDatabaseTransaction,
  entry: OnboardingGroupEntryRow,
): Promise<void> {
  await tx
    .delete(onboardingGroupEntries)
    .where(eq(onboardingGroupEntries.id, entry.id));
  await positionService.closeGap(
    tx,
    onboardingGroupEntries,
    eq(onboardingGroupEntries.field_id, entry.field_id),
    entry.position,
  );
}

function setPosition(
  tx: ContactDatabaseTransaction,
  entry: OnboardingGroupEntryRow,
  position: number,
) {
  return tx
    .update(onboardingGroupEntries)
    .set({ position, updated_at: new Date() })
    .where(eq(onboardingGroupEntries.id, entry.id));
}

/**
 * Swaps an entry with its neighbour; past either end nothing changes. The two positions cross, so
 * the unique index is checked once at the end.
 */
async function move(
  tx: ContactDatabaseTransaction,
  entry: OnboardingGroupEntryRow,
  direction: -1 | 1,
): Promise<void> {
  const entries = await listOfField(tx, entry.form_id, entry.field_id);
  const index = entries.findIndex((candidate) => candidate.id === entry.id);
  const neighbour = entries[index + direction];
  if (index === -1 || !neighbour) return;

  await positionService.withDeferredPositions(
    tx,
    OnboardingGroupEntriesConstraintName.PositionUnique,
    async () => {
      await setPosition(tx, entry, neighbour.position);
      await setPosition(tx, neighbour, entry.position);
    },
  );
}

export const onboardingGroupEntryService = {
  append,
  find,
  insertEntries,
  listOfField,
  move,
  remove,
} as const;
