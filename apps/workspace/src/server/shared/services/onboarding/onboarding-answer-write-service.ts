import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { onboardingAnswers } from "@invessiv/db/record-configuration";
import type {
  OnboardingAnswerAuthor,
  OnboardingAnswerSlot,
  OnboardingSlotWrite,
} from "./onboarding-form-types";

/** One row per text value or selected option; the list order becomes `sort_order`. */
function toRows(
  { slot, content }: OnboardingSlotWrite,
  author: OnboardingAnswerAuthor,
): (typeof onboardingAnswers.$inferInsert)[] {
  const entries =
    "choiceIds" in content
      ? content.choiceIds.map((choiceId) => ({
          choice_id: choiceId,
          value: null,
        }))
      : content.values.map((value) => ({ choice_id: null, value }));
  return entries.map((entry, sortOrder) => ({
    id: crypto.randomUUID(),
    form_id: slot.formId,
    field_id: slot.fieldId,
    group_entry_id: slot.groupEntryId,
    ...entry,
    sort_order: sortOrder,
    updated_by_portal_membership_id:
      "portalMembershipId" in author ? author.portalMembershipId : null,
    updated_by_member_id: "memberId" in author ? author.memberId : null,
  }));
}

function slotCondition(slot: OnboardingAnswerSlot) {
  return and(
    eq(onboardingAnswers.form_id, slot.formId),
    eq(onboardingAnswers.field_id, slot.fieldId),
    slot.groupEntryId === null
      ? isNull(onboardingAnswers.group_entry_id)
      : eq(onboardingAnswers.group_entry_id, slot.groupEntryId),
  );
}

/** Writes slots that hold nothing yet, as the pre-fill of new blocks does. */
async function insertSlots(
  tx: ContactDatabaseTransaction,
  writes: readonly OnboardingSlotWrite[],
  author: OnboardingAnswerAuthor,
): Promise<void> {
  const rows = writes.flatMap((write) => toRows(write, author));
  if (rows.length > 0) await tx.insert(onboardingAnswers).values(rows);
}

/**
 * Replaces everything a slot holds; empty content clears it. Whether the field belongs to the form
 * and the content fits the field decides the caller: this is only the one way answers are written.
 */
async function replaceSlot(
  tx: ContactDatabaseTransaction,
  write: OnboardingSlotWrite,
  author: OnboardingAnswerAuthor,
): Promise<void> {
  await tx.delete(onboardingAnswers).where(slotCondition(write.slot));
  await insertSlots(tx, [write], author);
}

export const onboardingAnswerWriteService = {
  insertSlots,
  replaceSlot,
} as const;
