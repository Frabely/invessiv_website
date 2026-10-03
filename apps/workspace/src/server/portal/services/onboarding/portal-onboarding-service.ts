import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import type { ContactDatabaseReader } from "@invessiv/db/core";
import {
  onboardingAnswers,
  questionnaireFields,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { loadPortalContactNames } from "@/server/shared/services/load-portal-contact-names";
import { onboardingFormMappingService } from "@/server/shared/services/onboarding/onboarding-form-mapping-service";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";
import { portalOnboardingAccessService as access } from "./portal-onboarding-access-service";
import { portalOnboardingMappingService } from "./portal-onboarding-mapping-service";
import type { PortalVisibleOnboardingForm } from "./portal-onboarding-types";
import { portalOnboardingWriteGuardService as writeGuard } from "./portal-onboarding-write-guard-service";

const CUSTOMER_EDITABLE_STATUSES: readonly OnboardingFormStatus[] =
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES;

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
    editableBlockIds: access.editableBlockIds(
      reader,
      form.status,
      dto.blocks.map((step) => ({
        blockId: step.block.id,
        reviewStatus: step.reviewStatus,
        clarificationMode: step.clarificationMode,
      })),
    ),
    canSubmit: access.canSubmit(reader),
    canAttach: access.canAttach(reader),
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
        access.canSubmit(reader) &&
        CUSTOMER_EDITABLE_STATUSES.includes(form.status),
    },
  );
}

/**
 * The one entry point of the portal handlers: who sees and writes a form
 * (`portal-onboarding-access-service`), which slot a write may hit
 * (`portal-onboarding-write-guard-service`) and the DTOs the form answers with.
 */
export const portalOnboardingService = {
  canRead: access.canRead,
  canAttach: access.canAttach,
  notFound: access.notFound,
  validation: access.validation,
  listVisibleForms: access.listVisibleForms,
  findVisibleForm: access.findVisibleForm,
  withLockedForm: access.withLockedForm,
  listEditableBlockIds: access.listEditableBlockIds,
  loadReviewRefs: access.loadReviewRefs,
  findWritableField: writeGuard.findWritableField,
  findWritableGroupEntry: writeGuard.findWritableGroupEntry,
  listGroupEntryDtos,
  toSavedDto,
  toFormDto,
  toSummaryDto,
} as const;
