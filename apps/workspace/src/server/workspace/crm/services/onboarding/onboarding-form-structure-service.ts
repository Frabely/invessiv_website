import "server-only";

import { and, eq, ne, notInArray } from "drizzle-orm";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { isOnboardingFormReleased } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { OnboardingFormBlocksConstraintName } from "@invessiv/db/constraint-names/crm/onboarding-form-blocks-constraint-names";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingForms,
  questionnaireBlocks,
  questionnaireFieldChoices,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingReviewService } from "@/server/shared/services/onboarding/onboarding-review-service";
import { positionService } from "@/server/shared/services/position-service";
import type {
  OnboardingFormBlockRow,
  OnboardingFormRow,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { onboardingFormAccessService } from "./onboarding-form-access-service";
import { onboardingFormSchemas } from "./onboarding-form-schemas";

type FormResult = OnboardingCommandResult<OnboardingFormDto>;
type Rejection = Extract<FormResult, { ok: false }>;

const FORM_NOT_FOUND = {
  ok: false,
  code: OnboardingErrorCode.FormNotFound,
} as const;
const BLOCK_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.BlockNotFound,
} as const;

/** The form version is what parallel editors of the block list compare; every structure change bumps it. */
function bumpVersion(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  patch: Partial<Pick<OnboardingFormRow, "source_template_id">> = {},
): Promise<OnboardingFormRow> {
  return updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch,
    },
    "Onboarding form changed while it was locked",
  );
}

/**
 * Runs a head or field command of one block of a form. The block stays the aggregate: its version
 * is compared by the shared definition service, which also answers with the block. The form is
 * locked for the access and status check, and a successful write bumps its version.
 */
async function runDefinitionCommand<T>(
  formId: string,
  actor: WorkspaceActor,
  command: (
    tx: ContactDatabaseTransaction,
    formId: string,
    form: OnboardingFormRow,
  ) => Promise<QuestionnaireCommandResult<T>>,
): Promise<OnboardingCommandResult<T>> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return FORM_NOT_FOUND;
  return questionnaireCommandSupport.run(
    async (tx): Promise<OnboardingCommandResult<T>> => {
      const locked = await onboardingFormAccessService.lockForStructure(
        tx,
        formId,
        actor,
      );
      if (!locked.ok) return locked;
      const result = await command(tx, locked.form.id, locked.form);
      if (result.ok) await bumpVersion(tx, locked.form);
      return result;
    },
  );
}

/**
 * Runs a command on the block list of a form. The form is the aggregate here: a stale version
 * answers with the current form, success with the changed one. `command` returns a rejection or
 * null once the list is written.
 */
async function runBlockListCommand(
  formId: string,
  expectedFormVersion: number,
  actor: WorkspaceActor,
  command: (
    tx: ContactDatabaseTransaction,
    form: OnboardingFormRow,
  ) => Promise<
    | Rejection
    | { formPatch: Partial<Pick<OnboardingFormRow, "source_template_id">> }
    | null
  >,
): Promise<FormResult> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return FORM_NOT_FOUND;
  return questionnaireCommandSupport.run(async (tx): Promise<FormResult> => {
    const locked = await onboardingFormAccessService.lockForStructure(
      tx,
      formId,
      actor,
    );
    if (!locked.ok) return locked;
    const toDto = (form: OnboardingFormRow) =>
      onboardingFormReadService.toFormDto(
        tx,
        form,
        fileAccessService.readableCondition(actor),
      );
    if (locked.form.version !== expectedFormVersion)
      return versionConflict(locked.form.version, await toDto(locked.form));
    const commandResult = await command(tx, locked.form);
    if (commandResult && "ok" in commandResult) return commandResult;
    return {
      ok: true,
      value: await toDto(
        await bumpVersion(tx, locked.form, commandResult?.formPatch),
      ),
    };
  });
}

function setStepPosition(
  tx: ContactDatabaseTransaction,
  step: OnboardingFormBlockRow,
  position: number,
) {
  return tx
    .update(onboardingFormBlocks)
    .set({ position })
    .where(
      and(
        eq(onboardingFormBlocks.form_id, step.form_id),
        eq(onboardingFormBlocks.block_id, step.block_id),
      ),
    );
}

/**
 * Swaps a step with its neighbour; past either end nothing changes. The two positions cross, so
 * the unique index is checked once at the end. The position is no part of the review, whose
 * version therefore stays as it is.
 */
async function moveStep(
  tx: ContactDatabaseTransaction,
  formId: string,
  blockId: string,
  direction: -1 | 1,
): Promise<Rejection | null> {
  const steps = await onboardingReviewService.listSteps(tx, formId);
  const index = steps.findIndex((step) => step.block_id === blockId);
  if (index === -1) return BLOCK_NOT_FOUND;
  const step = steps[index];
  const neighbour = steps[index + direction];
  if (!neighbour) return null;

  await positionService.withDeferredPositions(
    tx,
    OnboardingFormBlocksConstraintName.PositionUnique,
    async () => {
      await setStepPosition(tx, step, neighbour.position);
      await setStepPosition(tx, neighbour, step.position);
    },
  );
  return null;
}

/** Whether any block of the form other than `blockId` has a field. */
async function asksWithout(
  tx: ContactDatabaseTransaction,
  formId: string,
  blockId: string,
): Promise<boolean> {
  const [field] = await tx
    .select({ id: questionnaireFields.id })
    .from(questionnaireFields)
    .innerJoin(
      questionnaireBlocks,
      eq(questionnaireBlocks.id, questionnaireFields.block_id),
    )
    .where(
      and(
        eq(questionnaireBlocks.owner_form_id, formId),
        ne(questionnaireBlocks.id, blockId),
      ),
    )
    .limit(1);
  return field !== undefined;
}

/**
 * Whether an update of a field would delete an option that already has an answer. Options are
 * recognised by their key, so a changed key drops the old option, and its answer rows go with it
 * through the foreign key. Read under the form lock, which the portal's saves take as well.
 */
async function dropsAnsweredChoice(
  tx: ContactDatabaseTransaction,
  formId: string,
  fieldId: string,
  keptKeys: readonly string[],
): Promise<boolean> {
  const [answer] = await tx
    .select({ id: onboardingAnswers.id })
    .from(onboardingAnswers)
    .innerJoin(
      questionnaireFieldChoices,
      eq(questionnaireFieldChoices.id, onboardingAnswers.choice_id),
    )
    .where(
      and(
        eq(onboardingAnswers.form_id, formId),
        eq(onboardingAnswers.field_id, fieldId),
        keptKeys.length > 0
          ? notInArray(questionnaireFieldChoices.key, [...keptKeys])
          : undefined,
      ),
    )
    .limit(1);
  return answer !== undefined;
}

/**
 * Deletes a block of the form through the shared definition service; its step, fields, answers
 * and file links go with it, the files stay with the customer. The steps behind it move up in one
 * statement, which the deferrable index checks as a whole. A released form keeps at least one
 * block with a field, so the customer never gets a form that asks nothing.
 */
async function removeStep(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
  blockId: string,
): Promise<Rejection | null> {
  const formId = form.id;
  const step = await onboardingReviewService.findStep(tx, formId, blockId);
  const block = step
    ? await questionnaireDefinitionWriteService.lockBlock(tx, blockId, formId)
    : null;
  if (!step || !block) return BLOCK_NOT_FOUND;
  if (
    isOnboardingFormReleased(form.status) &&
    !(await asksWithout(tx, formId, blockId))
  )
    return { ok: false, code: OnboardingErrorCode.EmptyForm };

  const deleted = await questionnaireDefinitionWriteService.deleteBlock(
    tx,
    formId,
    blockId,
    block.version,
  );
  if (!deleted.ok)
    throw new Error("Onboarding form block changed while its form was locked");
  await positionService.closeGap(
    tx,
    onboardingFormBlocks,
    eq(onboardingFormBlocks.form_id, formId),
    step.position,
  );
  return null;
}

export const onboardingFormStructureService = {
  dropsAnsweredChoice,
  moveStep,
  removeStep,
  runBlockListCommand,
  runDefinitionCommand,
} as const;
