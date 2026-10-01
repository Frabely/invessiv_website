import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import type { OnboardingFormSummaryDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-summary.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireProgressDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-progress.dto";
import { filePresentationMappingService } from "@/server/shared/files/file-presentation-mapping-service";
import type {
  OnboardingAnswerFileWithFile,
  OnboardingAnswerRow,
  OnboardingFormBlockRow,
  OnboardingFormParts,
  OnboardingFormRow,
  OnboardingGroupEntryRow,
  OnboardingServiceSource,
} from "./onboarding-form-types";

const iso = (value: Date | null) => value?.toISOString() ?? null;

function toAnswerDto(row: OnboardingAnswerRow): QuestionnaireAnswerDto {
  return {
    fieldId: row.field_id,
    groupEntryId: row.group_entry_id,
    sortOrder: row.sort_order,
    value: row.value,
    choiceId: row.choice_id,
  };
}

function toGroupEntryDto(
  row: OnboardingGroupEntryRow,
): QuestionnaireGroupEntryDto {
  return { id: row.id, fieldId: row.field_id, position: row.position };
}

function toAnswerFileDto({
  link,
  file,
}: OnboardingAnswerFileWithFile): QuestionnaireAnswerFileDto {
  return {
    id: link.id,
    fieldId: link.field_id,
    groupEntryId: link.group_entry_id,
    position: link.position,
    file: filePresentationMappingService.toFields(file),
  };
}

function toStepDto(
  row: OnboardingFormBlockRow,
  block: QuestionnaireBlockDto,
): OnboardingFormBlockDto {
  return {
    position: row.position,
    reviewStatus: row.review_status,
    clarificationMode: row.clarification_mode,
    reviewNote: row.review_note,
    reviewedByMemberId: row.reviewed_by_member_id,
    reviewedAt: iso(row.reviewed_at),
    version: row.version,
    block,
  };
}

/** A line item stores an empty description as an empty string; the form shows none then. */
function toServiceDto(
  source: OnboardingServiceSource,
  position: number,
): OnboardingFormServiceDto {
  return {
    projectLineItemId: source.projectLineItemId,
    title: source.title,
    description: source.description?.trim() || null,
    position,
  };
}

/** Steps come out in form order; a step whose block is missing from `blocks` is left out. */
function toFormDto(parts: OnboardingFormParts): OnboardingFormDto {
  const { form } = parts;
  const blocks = new Map(parts.blocks.map((block) => [block.id, block]));
  return {
    id: form.id,
    customerId: form.customer_id,
    projectId: form.project_id,
    sourceTemplateId: form.source_template_id,
    status: form.status,
    createdByMemberId: form.created_by_member_id,
    releasedAt: iso(form.released_at),
    releasedByMemberId: form.released_by_member_id,
    submittedAt: iso(form.submitted_at),
    submittedByPortalMembershipId: form.submitted_by_portal_membership_id,
    servicesConfirmedAt: iso(form.services_confirmed_at),
    servicesConfirmedByPortalMembershipId:
      form.services_confirmed_by_portal_membership_id,
    servicesNote: form.services_note,
    servicesChangedSinceConfirmation: parts.servicesChangedSinceConfirmation,
    callHeldOn: form.call_held_on,
    completedAt: iso(form.completed_at),
    completedByMemberId: form.completed_by_member_id,
    blocks: [...parts.steps]
      .sort((left, right) => left.position - right.position)
      .flatMap((step) => {
        const block = blocks.get(step.block_id);
        return block ? [toStepDto(step, block)] : [];
      }),
    answers: parts.answers.map(toAnswerDto),
    answerFiles: parts.answerFiles.map(toAnswerFileDto),
    groupEntries: parts.groupEntries.map(toGroupEntryDto),
    services: [...parts.services],
    version: form.version,
    createdAt: form.created_at.toISOString(),
    updatedAt: form.updated_at.toISOString(),
  };
}

function toSummaryDto(
  form: OnboardingFormRow,
  progress: QuestionnaireProgressDto,
): OnboardingFormSummaryDto {
  return {
    id: form.id,
    status: form.status,
    progress,
    submittedAt: iso(form.submitted_at),
    completedAt: iso(form.completed_at),
  };
}

export const onboardingFormMappingService = {
  toAnswerDto,
  toAnswerFileDto,
  toFormDto,
  toGroupEntryDto,
  toServiceDto,
  toSummaryDto,
} as const;
