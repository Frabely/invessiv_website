import "server-only";

import { and, asc, eq, gt, sql } from "drizzle-orm";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { OnboardingFormBlocksConstraintName } from "@invessiv/db/constraint-names/crm/onboarding-form-blocks-constraint-names";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingFormBlocks,
  onboardingForms,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import type {
  OnboardingFormBlockRow,
  OnboardingFormRow,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
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

const stepPositionConstraint = sql.identifier(
  OnboardingFormBlocksConstraintName.PositionUnique,
);

/** The form version is what parallel editors of the block list compare; every structure change bumps it. */
function bumpVersion(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
): Promise<OnboardingFormRow> {
  return updateLockedVersioned(
    {
      tx,
      table: onboardingForms,
      id: form.id,
      expectedVersion: form.version,
      patch: {},
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
      const result = await command(tx, locked.form.id);
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
  ) => Promise<Rejection | null>,
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
      return {
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: locked.form.version,
          current: await toDto(locked.form),
        },
      };
    const rejection = await command(tx, locked.form);
    if (rejection) return rejection;
    return { ok: true, value: await toDto(await bumpVersion(tx, locked.form)) };
  });
}

function listSteps(
  tx: ContactDatabaseTransaction,
  formId: string,
): Promise<OnboardingFormBlockRow[]> {
  return tx
    .select()
    .from(onboardingFormBlocks)
    .where(eq(onboardingFormBlocks.form_id, formId))
    .orderBy(asc(onboardingFormBlocks.position));
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
  const steps = await listSteps(tx, formId);
  const index = steps.findIndex((step) => step.block_id === blockId);
  if (index === -1) return BLOCK_NOT_FOUND;
  const step = steps[index];
  const neighbour = steps[index + direction];
  if (!neighbour) return null;

  await tx.execute(sql`set constraints ${stepPositionConstraint} deferred`);
  await setStepPosition(tx, step, neighbour.position);
  await setStepPosition(tx, neighbour, step.position);
  await tx.execute(sql`set constraints ${stepPositionConstraint} immediate`);
  return null;
}

/**
 * Deletes a block of the form through the shared definition service; its step, fields, answers
 * and file links go with it, the files stay with the customer. The steps behind it move up in one
 * statement, which the deferrable index checks as a whole.
 */
async function removeStep(
  tx: ContactDatabaseTransaction,
  formId: string,
  blockId: string,
): Promise<Rejection | null> {
  const [step] = await tx
    .select()
    .from(onboardingFormBlocks)
    .where(
      and(
        eq(onboardingFormBlocks.form_id, formId),
        eq(onboardingFormBlocks.block_id, blockId),
      ),
    )
    .limit(1);
  const block = step
    ? await questionnaireDefinitionWriteService.lockBlock(tx, blockId, formId)
    : null;
  if (!step || !block) return BLOCK_NOT_FOUND;

  const deleted = await questionnaireDefinitionWriteService.deleteBlock(
    tx,
    formId,
    blockId,
    block.version,
  );
  if (!deleted.ok)
    throw new Error("Onboarding form block changed while its form was locked");
  await tx
    .update(onboardingFormBlocks)
    .set({ position: sql`${onboardingFormBlocks.position} - 1` })
    .where(
      and(
        eq(onboardingFormBlocks.form_id, formId),
        gt(onboardingFormBlocks.position, step.position),
      ),
    );
  return null;
}

export const onboardingFormStructureService = {
  listSteps,
  moveStep,
  removeStep,
  runBlockListCommand,
  runDefinitionCommand,
} as const;
