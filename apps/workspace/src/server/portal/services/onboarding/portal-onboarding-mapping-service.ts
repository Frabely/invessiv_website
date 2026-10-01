import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormSummaryDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-summary.dto";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import type {
  PortalOnboardingFormParts,
  PortalOnboardingSummaryContext,
} from "./portal-onboarding-types";

/**
 * The resolved block carries no keys, versions or other locales. The review of the team stays
 * internal as well, unless the block was handed back to the customer.
 */
function toBlockDto(
  step: OnboardingFormBlockDto,
  parts: PortalOnboardingFormParts,
): PortalOnboardingBlockDto {
  return {
    ...resolveQuestionnaireBlock(step.block, parts.locale),
    position: step.position,
    prefilled:
      step.block.carryOver && parts.prefilledBlockIds.has(step.block.id),
    reviewNote:
      step.clarificationMode === OnboardingClarificationMode.Customer
        ? step.reviewNote
        : null,
  };
}

function toFormDto(parts: PortalOnboardingFormParts): PortalOnboardingFormDto {
  const { form } = parts;
  return {
    id: form.id,
    projectId: form.projectId,
    projectTitle: parts.projectTitle,
    status: form.status,
    submittedAt: form.submittedAt,
    submittedByName: parts.submittedByName,
    completedAt: form.completedAt,
    blocks: form.blocks.map((step) => toBlockDto(step, parts)),
    answers: form.answers,
    groupEntries: form.groupEntries,
    answerFiles: form.answerFiles,
    // Without the line item id: the portal confirms what was agreed, it never addresses a service.
    services: form.services.map(({ title, description, position }) => ({
      title,
      description,
      position,
    })),
    servicesConfirmed: form.servicesConfirmedAt !== null,
    servicesNote: form.servicesNote,
    editableBlockIds: [...parts.editableBlockIds],
    lastEditedAt: parts.lastEditedAt?.toISOString() ?? null,
    lastEditedByName: parts.lastEditedByName,
    canSubmit: parts.canSubmit,
    canAttach: parts.canAttach,
  };
}

function toSummaryDto(
  summary: OnboardingFormSummaryDto,
  context: PortalOnboardingSummaryContext,
): PortalOnboardingFormSummaryDto {
  return { ...summary, ...context };
}

export const portalOnboardingMappingService = {
  toFormDto,
  toSummaryDto,
} as const;
