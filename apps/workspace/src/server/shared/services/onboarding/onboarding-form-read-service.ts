import "server-only";

import { and, asc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";

import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-visible-line-item-statuses";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import type { OnboardingFormSummaryDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-summary.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import {
  files,
  onboardingAnswerFiles,
  onboardingAnswers,
  onboardingFormBlocks,
  onboardingFormServices,
  onboardingGroupEntries,
  projectLineItems,
} from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";
import type { QuestionnaireReadExecutor } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-types";
import { onboardingFormMappingService } from "./onboarding-form-mapping-service";
import type {
  OnboardingFormBlockRow,
  OnboardingFormRow,
} from "./onboarding-form-types";

type Structure = {
  steps: OnboardingFormBlockRow[];
  blocks: QuestionnaireBlockDto[];
};

/** The steps of a form with their block copies, both in form order. */
async function loadStructure(
  executor: QuestionnaireReadExecutor,
  formId: string,
): Promise<Structure> {
  const steps = await executor
    .select()
    .from(onboardingFormBlocks)
    .where(eq(onboardingFormBlocks.form_id, formId))
    .orderBy(asc(onboardingFormBlocks.position));
  const blocks = await questionnaireDefinitionReadService.findBlocks(
    executor,
    steps.map((step) => step.block_id),
    formId,
  );
  return { steps, blocks };
}

function loadAnswers(executor: QuestionnaireReadExecutor, formId: string) {
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

function loadGroupEntries(executor: QuestionnaireReadExecutor, formId: string) {
  return executor
    .select()
    .from(onboardingGroupEntries)
    .where(eq(onboardingGroupEntries.form_id, formId))
    .orderBy(
      asc(onboardingGroupEntries.field_id),
      asc(onboardingGroupEntries.position),
    );
}

/**
 * The single place that picks the source of the booked services: the live line items of the
 * project until completion, the frozen snapshot afterwards.
 */
async function loadServices(
  executor: QuestionnaireReadExecutor,
  form: OnboardingFormRow,
): Promise<OnboardingFormServiceDto[]> {
  if (form.status === OnboardingFormStatus.Completed) {
    const rows = await executor
      .select()
      .from(onboardingFormServices)
      .where(eq(onboardingFormServices.form_id, form.id))
      .orderBy(asc(onboardingFormServices.position));
    return rows.map((row) =>
      onboardingFormMappingService.toServiceDto(
        {
          projectLineItemId: row.project_line_item_id,
          title: row.title,
          description: row.description,
        },
        row.position,
      ),
    );
  }
  const rows = await executor
    .select()
    .from(projectLineItems)
    .where(
      and(
        eq(projectLineItems.project_id, form.project_id),
        or(
          isNull(projectLineItems.status),
          inArray(projectLineItems.status, [
            ...ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES,
          ]),
        ),
      ),
    )
    .orderBy(asc(projectLineItems.created_at), asc(projectLineItems.id));
  return rows.map((row, position) =>
    onboardingFormMappingService.toServiceDto(
      {
        projectLineItemId: row.id,
        title: row.title,
        description: row.description,
      },
      position,
    ),
  );
}

/**
 * The whole form for one viewer. `fileVisibility` is the caller's file filter (internal scope or
 * portal release); a link to a file outside it is left out, as in the chat and in feedback rounds.
 */
async function toFormDto(
  executor: QuestionnaireReadExecutor,
  form: OnboardingFormRow,
  fileVisibility: SQL,
): Promise<OnboardingFormDto> {
  const [structure, answers, groupEntries, answerFiles, services] =
    await Promise.all([
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
      loadServices(executor, form),
    ]);
  return onboardingFormMappingService.toFormDto({
    form,
    ...structure,
    answers,
    groupEntries,
    answerFiles,
    services,
  });
}

/**
 * Fetches the inputs and hands them to `getQuestionnaireCompleteness`; no rule about visibility,
 * requirement or progress lives here. Every file link counts, whoever may open the file: the
 * progress of a form must not depend on the viewer.
 */
async function toSummaryDto(
  executor: QuestionnaireReadExecutor,
  form: OnboardingFormRow,
): Promise<OnboardingFormSummaryDto> {
  const [structure, answers, groupEntries, answerFiles] = await Promise.all([
    loadStructure(executor, form.id),
    loadAnswers(executor, form.id),
    loadGroupEntries(executor, form.id),
    executor
      .select({
        fieldId: onboardingAnswerFiles.field_id,
        groupEntryId: onboardingAnswerFiles.group_entry_id,
      })
      .from(onboardingAnswerFiles)
      .where(eq(onboardingAnswerFiles.form_id, form.id)),
  ]);
  const { answeredRequired, totalRequired, ratio } =
    getQuestionnaireCompleteness({
      blocks: structure.blocks,
      answers: answers.map(onboardingFormMappingService.toAnswerDto),
      answerFiles,
      groupEntries: groupEntries.map(
        onboardingFormMappingService.toGroupEntryDto,
      ),
      servicesConfirmed: form.services_confirmed_at !== null,
    });
  return onboardingFormMappingService.toSummaryDto(form, {
    answeredRequired,
    totalRequired,
    ratio,
  });
}

export const onboardingFormReadService = {
  toFormDto,
  toSummaryDto,
} as const;
