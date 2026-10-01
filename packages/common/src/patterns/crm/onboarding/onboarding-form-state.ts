import { OnboardingBlockReviewStatus } from "../../../constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "../../../constants/crm/onboarding/onboarding-clarification-modes";
import { ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES } from "../../../constants/crm/onboarding/onboarding-eligible-project-statuses";
import {
  ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES,
  OnboardingFormStatus,
} from "../../../constants/crm/onboarding/onboarding-form-statuses";
import { ONBOARDING_FORM_TRANSITIONS } from "../../../constants/crm/onboarding/onboarding-form-transitions";
import type { OnboardingTransitionSide } from "../../../constants/crm/onboarding/onboarding-transition-sides";
import type { ProjectStatus } from "../../../constants/crm/project-statuses";
import type { OnboardingBlockReviewRef } from "../../../contracts/crm/onboarding/onboarding-block-review-ref";

/** Whether blocks and fields of a form may still change; the server enforces it, the UI follows. */
export function isOnboardingStructureEditable(
  status: OnboardingFormStatus,
): boolean {
  return (
    ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES as readonly OnboardingFormStatus[]
  ).includes(status);
}

/** Whether an onboarding may be started for a project in this status. */
export function isOnboardingProjectEligible(status: ProjectStatus): boolean {
  return (
    ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES as readonly ProjectStatus[]
  ).includes(status);
}

export function canTransitionOnboardingForm(
  from: OnboardingFormStatus,
  to: OnboardingFormStatus,
  side: OnboardingTransitionSide,
): boolean {
  return ONBOARDING_FORM_TRANSITIONS.some(
    (transition) =>
      transition.from === from &&
      transition.to === to &&
      transition.side === side,
  );
}

/**
 * The blocks a customer may write answers into: all of an open form, during a change request only
 * those the team handed back to the customer. A question for the call stays with the team.
 */
export function listCustomerEditableOnboardingBlockIds(
  status: OnboardingFormStatus,
  blocks: readonly OnboardingBlockReviewRef[],
): string[] {
  if (status === OnboardingFormStatus.Open)
    return blocks.map((block) => block.blockId);
  if (status !== OnboardingFormStatus.ChangesRequested) return [];
  return blocks
    .filter(
      (block) =>
        block.reviewStatus === OnboardingBlockReviewStatus.Clarification &&
        block.clarificationMode === OnboardingClarificationMode.Customer,
    )
    .map((block) => block.blockId);
}
