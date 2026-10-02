import "server-only";

import { and, desc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES,
  ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
  type OnboardingFormStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingBlockReviewRef } from "@invessiv/common/contracts/crm/onboarding/onboarding-block-review-ref";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { listCustomerEditableOnboardingBlockIds } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import {
  type ContactDatabaseReader,
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingForms,
  onboardingGroupEntries,
  projects,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { onboardingFormMappingService } from "@/server/shared/services/onboarding/onboarding-form-mapping-service";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import type {
  OnboardingAnswerSlot,
  OnboardingFormRow,
  OnboardingGroupEntryRow,
} from "@/server/shared/services/onboarding/onboarding-form-types";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";
import { portalOnboardingMappingService } from "./portal-onboarding-mapping-service";
import { portalOnboardingSchemas } from "./portal-onboarding-schemas";
import type { PortalVisibleOnboardingForm } from "./portal-onboarding-types";

const CUSTOMER_EDITABLE_STATUSES: readonly OnboardingFormStatus[] =
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES;

function canRead(reader: PortalReader): boolean {
  return portalCanOn.forReader(reader, Permission.PortalOnboardingRead, {
    customerId: reader.customerId,
  });
}

/** The owner view reads but never writes, whatever it holds. */
function canSubmit(reader: PortalReader): boolean {
  return (
    !isPortalOwnerView(reader) &&
    canRead(reader) &&
    portalCanOn.forActor(reader, Permission.PortalOnboardingSubmit, {
      customerId: reader.customerId,
    })
  );
}

/**
 * Attaching and detaching show files through the portal's file visibility, which needs
 * `portal.files.read`. Without it a contact could hang files onto a field and never see them again.
 */
function canAttach(reader: PortalReader): boolean {
  return (
    canSubmit(reader) &&
    portalCanOn.forReader(reader, Permission.PortalFilesRead, {
      customerId: reader.customerId,
    })
  );
}

function notFound(): PortalOnboardingResult<never> {
  return { ok: false, code: PortalOnboardingErrorCode.NotFound };
}

function validation(): PortalOnboardingResult<never> {
  return { ok: false, code: PortalOnboardingErrorCode.Validation };
}

/**
 * The single definition of "a form the portal shows to this reader": released, of the reader's
 * company and on a project the portal shows. Expects `projects` joined to the form.
 */
function visibleCondition(reader: PortalReader): SQL {
  return and(
    eq(onboardingForms.customer_id, reader.customerId),
    inArray(onboardingForms.status, [
      ...ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
    ]),
    portalProjectCondition(reader, Permission.PortalOnboardingRead),
  )!;
}

function selectVisibleForms(executor: ContactDatabaseReader, condition: SQL) {
  return executor
    .select({ form: onboardingForms, projectTitle: projects.title })
    .from(onboardingForms)
    .innerJoin(projects, eq(projects.id, onboardingForms.project_id))
    .where(condition);
}

/** Newest first; a company usually has one, a follow-up project adds another. */
function listVisibleForms(
  executor: ContactDatabaseReader,
  reader: PortalReader,
): Promise<PortalVisibleOnboardingForm[]> {
  return selectVisibleForms(executor, visibleCondition(reader)).orderBy(
    desc(onboardingForms.created_at),
  );
}

/** Every miss — guessed id, foreign company, draft, hidden project, missing permission — is null. */
async function findVisibleForm(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  formId: string,
): Promise<PortalVisibleOnboardingForm | null> {
  const id = portalOnboardingSchemas.id.safeParse(formId);
  if (!id.success) return null;
  const [row] = await selectVisibleForms(
    executor,
    and(eq(onboardingForms.id, id.data), visibleCondition(reader))!,
  ).limit(1);
  return row ?? null;
}

/**
 * The frame of every portal form command: one transaction, the form locked first, a miss as
 * `not_found`. Autosaves and the submission of one form serialize on this lock, so nothing is
 * written into a form that was submitted a moment before.
 */
function withLockedForm<T>(
  actor: PortalActor,
  formId: string,
  run: (
    tx: ContactDatabaseTransaction,
    locked: PortalVisibleOnboardingForm,
  ) => Promise<PortalOnboardingResult<T>>,
): Promise<PortalOnboardingResult<T>> {
  const id = portalOnboardingSchemas.id.safeParse(formId);
  if (!canSubmit(actor) || !id.success) return Promise.resolve(notFound());
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [locked] = await selectVisibleForms(
      tx,
      and(eq(onboardingForms.id, id.data), visibleCondition(actor))!,
    )
      .limit(1)
      .for("update", { of: onboardingForms });
    return locked ? run(tx, locked) : notFound();
  });
}

function editableBlockIds(
  reader: PortalReader,
  status: OnboardingFormStatus,
  blocks: readonly OnboardingBlockReviewRef[],
): string[] {
  return canSubmit(reader)
    ? listCustomerEditableOnboardingBlockIds(status, blocks)
    : [];
}

async function loadReviewRefs(
  executor: ContactDatabaseReader,
  formId: string,
): Promise<OnboardingBlockReviewRef[]> {
  return executor
    .select({
      blockId: onboardingFormBlocks.block_id,
      reviewStatus: onboardingFormBlocks.review_status,
      clarificationMode: onboardingFormBlocks.clarification_mode,
    })
    .from(onboardingFormBlocks)
    .where(eq(onboardingFormBlocks.form_id, formId));
}

/** The blocks the actor may write into right now, read under the form lock. */
async function listEditableBlockIds(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
): Promise<string[]> {
  return editableBlockIds(
    actor,
    form.status,
    await loadReviewRefs(tx, form.id),
  );
}

/**
 * The field of a slot the actor may write right now. A field of another form is `not_found`, a
 * block that is not open for the customer `locked`. A sub-field needs an entry of its own group
 * in this form, a block-level field none.
 */
async function findWritableField(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
  slot: OnboardingAnswerSlot,
): Promise<PortalOnboardingResult<QuestionnaireFieldDto>> {
  const field = await onboardingFormReadService.findField(
    tx,
    form.id,
    slot.fieldId,
  );
  if (!field) return notFound();
  const editable = await listEditableBlockIds(tx, actor, form);
  if (!editable.includes(field.blockId))
    return { ok: false, code: PortalOnboardingErrorCode.Locked };

  const invalid = {
    ok: false,
    code: PortalOnboardingErrorCode.Validation,
  } as const;
  if ((field.parentFieldId === null) !== (slot.groupEntryId === null))
    return invalid;
  if (slot.groupEntryId !== null && field.parentFieldId !== null) {
    const [entry] = await tx
      .select({ id: onboardingGroupEntries.id })
      .from(onboardingGroupEntries)
      .where(
        and(
          eq(onboardingGroupEntries.id, slot.groupEntryId),
          eq(onboardingGroupEntries.form_id, form.id),
          eq(onboardingGroupEntries.field_id, field.parentFieldId),
        ),
      )
      .limit(1);
    if (!entry) return invalid;
  }
  return { ok: true, value: field };
}

/**
 * A group entry of this form whose block the actor may write right now. An entry of another form
 * is `not_found`, a block that is not open for the customer `locked`.
 */
async function findWritableGroupEntry(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
  entryId: string,
): Promise<PortalOnboardingResult<OnboardingGroupEntryRow>> {
  const id = portalOnboardingSchemas.id.safeParse(entryId);
  const entry = id.success
    ? await onboardingGroupEntryService.find(tx, id.data)
    : null;
  if (!entry || entry.form_id !== form.id) return notFound();
  const field = await findWritableField(tx, actor, form, {
    formId: form.id,
    fieldId: entry.field_id,
    groupEntryId: null,
  });
  return field.ok ? { ok: true, value: entry } : field;
}

/** The entries of a group in display order, as every group command answers. */
async function listGroupEntryDtos(
  executor: ContactDatabaseReader,
  formId: string,
  fieldId: string,
): Promise<QuestionnaireGroupEntryDto[]> {
  const entries = await onboardingGroupEntryService.listOfField(
    executor,
    formId,
    fieldId,
  );
  return entries.map(onboardingFormMappingService.toGroupEntryDto);
}

/** What every write answers with, for the status line of the form. */
async function toSavedDto(
  executor: ContactDatabaseReader,
  actor: PortalActor,
): Promise<PortalOnboardingAnswerSavedDto> {
  const names = await loadPortalContactNames(executor, [actor.membershipId]);
  return {
    savedAt: new Date().toISOString(),
    savedByName: names.get(actor.membershipId) ?? null,
  };
}

/** The newest answer row stands for "last edited"; the form head is not touched by autosaves. */
async function loadLastAnswer(executor: ContactDatabaseReader, formId: string) {
  const [row] = await executor
    .select({
      at: onboardingAnswers.updated_at,
      membershipId: onboardingAnswers.updated_by_portal_membership_id,
    })
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.form_id, formId))
    .orderBy(desc(onboardingAnswers.updated_at))
    .limit(1);
  return row ?? null;
}

/**
 * Blocks with answers the team wrote, which only the pre-fill before the release does. A
 * customer's save replaces the rows of a slot, so a block drops out once every taken-over answer
 * was touched. The author decides, not a comparison with `released_at`: that stamp comes from the
 * application clock, `updated_at` from the database.
 */
async function loadPrefilledBlockIds(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<Set<string>> {
  const rows = await executor
    .select({ blockId: questionnaireFields.block_id })
    .from(onboardingAnswers)
    .innerJoin(
      questionnaireFields,
      eq(questionnaireFields.id, onboardingAnswers.field_id),
    )
    .where(
      and(
        eq(onboardingAnswers.form_id, form.id),
        isNotNull(onboardingAnswers.updated_by_member_id),
      ),
    )
    .groupBy(questionnaireFields.block_id);
  return new Set(rows.map((row) => row.blockId));
}

/** The whole form for one reader; attached files follow the portal's own file visibility. */
async function toFormDto(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  { form, projectTitle }: PortalVisibleOnboardingForm,
  locale: Locale,
): Promise<PortalOnboardingFormDto> {
  const [dto, lastAnswer, prefilledBlockIds] = await Promise.all([
    onboardingFormReadService.toFormDto(
      executor,
      form,
      portalFileService.visibleCondition(reader),
    ),
    loadLastAnswer(executor, form.id),
    loadPrefilledBlockIds(executor, form),
  ]);
  const names = await loadPortalContactNames(executor, [
    form.submitted_by_portal_membership_id,
    lastAnswer?.membershipId ?? null,
  ]);
  const nameOf = (membershipId: string | null | undefined) =>
    (membershipId && names.get(membershipId)) || null;
  return portalOnboardingMappingService.toFormDto({
    form: dto,
    locale,
    projectTitle,
    editableBlockIds: editableBlockIds(
      reader,
      form.status,
      dto.blocks.map((step) => ({
        blockId: step.block.id,
        reviewStatus: step.reviewStatus,
        clarificationMode: step.clarificationMode,
      })),
    ),
    canSubmit: canSubmit(reader),
    canAttach: canAttach(reader),
    prefilledBlockIds,
    submittedByName: nameOf(form.submitted_by_portal_membership_id),
    lastEditedAt: lastAnswer?.at ?? null,
    lastEditedByName: nameOf(lastAnswer?.membershipId),
  });
}

async function toSummaryDto(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  { form, projectTitle }: PortalVisibleOnboardingForm,
): Promise<PortalOnboardingFormSummaryDto> {
  return portalOnboardingMappingService.toSummaryDto(
    await onboardingFormReadService.toSummaryDto(executor, form),
    {
      projectId: form.project_id,
      projectTitle,
      canEdit:
        canSubmit(reader) && CUSTOMER_EDITABLE_STATUSES.includes(form.status),
    },
  );
}

export const portalOnboardingService = {
  canRead,
  canAttach,
  notFound,
  listVisibleForms,
  findVisibleForm,
  withLockedForm,
  listEditableBlockIds,
  loadReviewRefs,
  findWritableField,
  findWritableGroupEntry,
  listGroupEntryDtos,
  toSavedDto,
  toFormDto,
  toSummaryDto,
  validation,
} as const;
