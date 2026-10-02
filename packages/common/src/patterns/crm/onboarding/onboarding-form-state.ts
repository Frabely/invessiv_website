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

/**
 * Whether the customer has seen the form. From then on a structure change must neither delete an
 * answer unnoticed nor leave a step that asks nothing.
 */
export function isOnboardingFormReleased(
  status: OnboardingFormStatus,
): boolean {
  return status !== OnboardingFormStatus.Draft;
}

/** Whether an onboarding may be started for a project in this status. */
export function isOnboardingProjectEligible(status: ProjectStatus): boolean {
  return (
    ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES as readonly ProjectStatus[]
  ).includes(status);
}

/**
 * Whether the team may review blocks: only while the form lies with it. During a change request
 * the customer works on it, and a completed form is final.
 */
export function isOnboardingReviewOpen(status: OnboardingFormStatus): boolean {
  return status === OnboardingFormStatus.Submitted;
}

/**
 * Whether the portal offers the onboarding call: the form lies with the team, every block is
 * reviewed and nothing has to go back to the customer first. A question kept for the call does
 * not hold it up, it is what the call is for. During a change request and after a new submission
 * the call waits again until the team has looked at the additions.
 */
export function isOnboardingCallBookable(
  status: OnboardingFormStatus,
  blocks: readonly OnboardingBlockReviewRef[],
): boolean {
  return (
    status === OnboardingFormStatus.Submitted &&
    blocks.every(
      (block) =>
        block.reviewStatus !== OnboardingBlockReviewStatus.Pending &&
        !(
          block.reviewStatus === OnboardingBlockReviewStatus.Clarification &&
          block.clarificationMode === OnboardingClarificationMode.Customer
        ),
    )
  );
}

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether `value` names the day of a call that can have taken place: a real calendar day as
 * `YYYY-MM-DD`, not later than `today`. The caller passes today in the business time zone.
 */
export function isOnboardingCallDateAcceptable(
  value: string,
  today: string,
): boolean {
  if (!CALENDAR_DAY.test(value)) return false;
  const day = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(day.getTime()) &&
    day.toISOString().slice(0, 10) === value &&
    value <= today
  );
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
