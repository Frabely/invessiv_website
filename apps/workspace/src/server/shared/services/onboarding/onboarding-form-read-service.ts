import "server-only";

import { and, asc, eq, gt, type SQL } from "drizzle-orm";

import type { ContactDatabaseReader } from "@invessiv/db/core";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import type { OnboardingFormSummaryDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-summary.dto";
import type { OnboardingReviewSummary } from "@invessiv/common/contracts/crm/onboarding/onboarding-review-summary";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCompleteness } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { summarizeOnboardingReview } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { findQuestionnaireField } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingGroupEntries,
  projectLineItems,
} from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { onboardingFormMappingService } from "./onboarding-form-mapping-service";
import type {
  OnboardingFormBlockRow,
  OnboardingFormRow,
} from "./onboarding-form-types";
import { onboardingReviewService } from "./onboarding-review-service";
import { onboardingServicesSnapshotService } from "./onboarding-services-snapshot-service";

type Structure = {
  steps: OnboardingFormBlockRow[];
  blocks: QuestionnaireBlockDto[];
};

/** The steps of a form with their block copies, both in form order. */
async function loadStructure(
  executor: ContactDatabaseReader,
  formId: string,
): Promise<Structure> {
  const steps = await onboardingReviewService.listSteps(executor, formId);
  const blocks = await questionnaireDefinitionReadService.findBlocks(
    executor,
    steps.map((step) => step.block_id),
    formId,
  );
  return { steps, blocks };
}

function loadAnswers(executor: ContactDatabaseReader, formId: string) {
  return executor
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.form_id, formId))
    .orderBy(
      asc(onboardingAnswers.field_id),
      asc(onboardingAnswers.sort_order),
      asc(onboardingAnswers.id),
    );
}

function loadGroupEntries(executor: ContactDatabaseReader, formId: string) {
  return executor
    .select()
    .from(onboardingGroupEntries)
    .where(eq(onboardingGroupEntries.form_id, formId))
    .orderBy(
      asc(onboardingGroupEntries.field_id),
      asc(onboardingGroupEntries.position),
    );
}

/** Every file link of a form, whoever may open the file: what the completeness counts. */
function loadAnswerFileRefs(executor: ContactDatabaseReader, formId: string) {
  return executor
    .select({
      id: onboardingAnswerFiles.id,
      fieldId: onboardingAnswerFiles.field_id,
      groupEntryId: onboardingAnswerFiles.group_entry_id,
    })
    .from(onboardingAnswerFiles)
    .where(eq(onboardingAnswerFiles.form_id, formId));
}

/**
 * The single place that picks the source of the booked services: the live line items of the
 * project until completion, the frozen snapshot afterwards.
 */
async function loadServices(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<OnboardingFormServiceDto[]> {
  const services =
    form.status === OnboardingFormStatus.Completed
      ? await onboardingServicesSnapshotService.listFrozen(executor, form.id)
      : await onboardingServicesSnapshotService.listLive(
          executor,
          form.project_id,
        );
  return services.map(onboardingFormMappingService.toServiceDto);
}

/**
 * Whether a line item of the project changed after the customer confirmed the services. Every
 * status of a line item counts, a rejected one as well: rejecting is such a change. A completed
 * form shows its frozen snapshot, which nothing changes anymore.
 */
async function servicesChangedSinceConfirmation(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<boolean> {
  if (
    form.services_confirmed_at === null ||
    form.status === OnboardingFormStatus.Completed
  )
    return false;
  const [changed] = await executor
    .select({ id: projectLineItems.id })
    .from(projectLineItems)
    .where(
      and(
        eq(projectLineItems.project_id, form.project_id),
        gt(projectLineItems.updated_at, form.services_confirmed_at),
      ),
    )
    .limit(1);
  return !!changed;
}

/**
 * The whole form for one viewer. `fileVisibility` is the caller's file filter (internal scope or
 * portal release); a link to a file outside it comes without its file, only as the slot it fills.
 */
async function toFormDto(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
  fileVisibility: SQL,
): Promise<OnboardingFormDto> {
  const [
    structure,
    answers,
    groupEntries,
    answerFiles,
    answerFileRefs,
    services,
    changed,
  ] = await Promise.all([
    loadStructure(executor, form.id),
    loadAnswers(executor, form.id),
    loadGroupEntries(executor, form.id),
    executor
      .select({ link: onboardingAnswerFiles, file: files })
      .from(onboardingAnswerFiles)
      .innerJoin(
        files,
        and(eq(files.id, onboardingAnswerFiles.file_id), fileVisibility),
      )
      .where(eq(onboardingAnswerFiles.form_id, form.id))
      .orderBy(
        asc(onboardingAnswerFiles.field_id),
        asc(onboardingAnswerFiles.position),
        asc(onboardingAnswerFiles.id),
      ),
    loadAnswerFileRefs(executor, form.id),
    loadServices(executor, form),
    servicesChangedSinceConfirmation(executor, form),
  ]);
  return onboardingFormMappingService.toFormDto({
    form,
    ...structure,
    answers,
    groupEntries,
    answerFiles,
    answerFileRefs,
    services,
    servicesChangedSinceConfirmation: changed,
  });
}

/**
 * Fetches the inputs and hands them to `getQuestionnaireCompleteness`; no rule about visibility,
 * requirement or progress lives here. Every file link counts, whoever may open the file: the
 * progress of a form must not depend on the viewer.
 */
async function completenessOf(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
  structure: Structure | Promise<Structure>,
): Promise<QuestionnaireCompleteness> {
  const [loaded, answers, groupEntries, answerFiles] = await Promise.all([
    structure,
    loadAnswers(executor, form.id),
    loadGroupEntries(executor, form.id),
    loadAnswerFileRefs(executor, form.id),
  ]);
  return getQuestionnaireCompleteness({
    blocks: loaded.blocks,
    answers: answers.map(onboardingFormMappingService.toAnswerDto),
    answerFiles,
    groupEntries: groupEntries.map(
      onboardingFormMappingService.toGroupEntryDto,
    ),
    servicesConfirmed: form.services_confirmed_at !== null,
  });
}

function toCompleteness(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<QuestionnaireCompleteness> {
  return completenessOf(executor, form, loadStructure(executor, form.id));
}

function toSummary(
  form: OnboardingFormRow,
  completeness: QuestionnaireCompleteness,
) {
  const { answeredRequired, totalRequired, ratio } = completeness;
  return onboardingFormMappingService.toSummaryDto(form, {
    answeredRequired,
    totalRequired,
    ratio,
  });
}

async function toSummaryDto(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<OnboardingFormSummaryDto> {
  return toSummary(form, await toCompleteness(executor, form));
}

/**
 * The summary together with the review counts, from one read of the steps; the project area shows
 * both and must not load the steps twice.
 */
async function toProjectSummary(
  executor: ContactDatabaseReader,
  form: OnboardingFormRow,
): Promise<{
  summary: OnboardingFormSummaryDto;
  review: OnboardingReviewSummary;
}> {
  const structure = await loadStructure(executor, form.id);
  return {
    summary: toSummary(form, await completenessOf(executor, form, structure)),
    review: summarizeOnboardingReview(
      structure.steps.map((step) => ({
        reviewStatus: step.review_status,
        clarificationMode: step.clarification_mode,
      })),
    ),
  };
}

/** A field of one of the form's own blocks; a field of another form or of the catalog is null. */
async function findField(
  executor: ContactDatabaseReader,
  formId: string,
  fieldId: string,
): Promise<QuestionnaireFieldDto | null> {
  const blockId = await questionnaireDefinitionReadService.findFieldBlockId(
    executor,
    fieldId,
    formId,
  );
  if (!blockId) return null;
  const block = await questionnaireDefinitionReadService.findBlock(
    executor,
    blockId,
    formId,
  );
  return (block && findQuestionnaireField(block, fieldId)) ?? null;
}

export const onboardingFormReadService = {
  findField,
  toCompleteness,
  toFormDto,
  toProjectSummary,
  toSummaryDto,
} as const;
