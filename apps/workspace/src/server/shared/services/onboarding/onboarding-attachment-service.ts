import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { onboardingAnswerFiles } from "@invessiv/db/record-configuration";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { positionService } from "@/server/shared/services/position-service";
import { onboardingFormMappingService } from "./onboarding-form-mapping-service";
import type {
  OnboardingAnswerFileRow,
  OnboardingAnswerFileWrite,
  OnboardingAnswerSlot,
} from "./onboarding-form-types";

function slotCondition(slot: OnboardingAnswerSlot) {
  return and(
    eq(onboardingAnswerFiles.form_id, slot.formId),
    eq(onboardingAnswerFiles.field_id, slot.fieldId),
    slot.groupEntryId === null
      ? isNull(onboardingAnswerFiles.group_entry_id)
      : eq(onboardingAnswerFiles.group_entry_id, slot.groupEntryId),
  );
}

/** The links of one files slot in display order. */
function listOfSlot(
  executor: ContactDatabaseReader,
  slot: OnboardingAnswerSlot,
): Promise<OnboardingAnswerFileRow[]> {
  return executor
    .select()
    .from(onboardingAnswerFiles)
    .where(slotCondition(slot))
    .orderBy(asc(onboardingAnswerFiles.position));
}

async function find(
  executor: ContactDatabaseReader,
  id: string,
): Promise<OnboardingAnswerFileRow | null> {
  const [link] = await executor
    .select()
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.id, id))
    .limit(1);
  return link ?? null;
}

/** Whether a file hangs on any form; such a file must not be deleted from under it. */
async function isBound(
  executor: ContactDatabaseReader,
  fileId: string,
): Promise<boolean> {
  const [link] = await executor
    .select({ id: onboardingAnswerFiles.id })
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.file_id, fileId))
    .limit(1);
  return !!link;
}

/**
 * Links a file to a files slot. Whether the slot takes it (field type, kind, limit, ownership)
 * decides the caller, who also holds the form and the file locked: this is only the one place
 * `onboarding_answer_files` is written.
 */
async function attach(
  tx: ContactDatabaseTransaction,
  slot: OnboardingAnswerSlot,
  file: FileRow,
  position: number,
): Promise<QuestionnaireAnswerFileDto> {
  const [link] = await tx
    .insert(onboardingAnswerFiles)
    .values({
      id: crypto.randomUUID(),
      form_id: slot.formId,
      field_id: slot.fieldId,
      group_entry_id: slot.groupEntryId,
      file_id: file.id,
      position,
    })
    .returning();
  return onboardingFormMappingService.toAnswerFileDto({ link, file });
}

/**
 * Links files to slots at the positions given, as the pre-fill of new blocks does with the files
 * of an earlier form. Whether slot, file and position fit decides the caller.
 */
async function insertLinks(
  tx: ContactDatabaseTransaction,
  links: readonly OnboardingAnswerFileWrite[],
): Promise<void> {
  if (links.length === 0) return;
  await tx.insert(onboardingAnswerFiles).values(
    links.map(({ slot, fileId, position }) => ({
      id: crypto.randomUUID(),
      form_id: slot.formId,
      field_id: slot.fieldId,
      group_entry_id: slot.groupEntryId,
      file_id: fileId,
      position,
    })),
  );
}

/** Removes the link only; the file stays in the customer's files. The links behind it move up. */
async function detach(
  tx: ContactDatabaseTransaction,
  link: OnboardingAnswerFileRow,
): Promise<void> {
  await tx
    .delete(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.id, link.id));
  await positionService.closeGap(
    tx,
    onboardingAnswerFiles,
    slotCondition({
      formId: link.form_id,
      fieldId: link.field_id,
      groupEntryId: link.group_entry_id,
    }),
    link.position,
  );
}

export const onboardingAttachmentService = {
  attach,
  detach,
  find,
  insertLinks,
  isBound,
  listOfSlot,
} as const;
