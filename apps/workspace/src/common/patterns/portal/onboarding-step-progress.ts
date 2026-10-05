import type { QuestionnaireBlockProgress } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-progress";
import { OnboardingStepStatusKind } from "@/common/constants/portal/onboarding-step-status-kinds";
import type { OnboardingStepStatus } from "@/common/contracts/portal/onboarding-step-status";

/**
 * How the step track shows one block. The fill follows every answered question, required or not.
 * Whether the block is acceptable is a second, independent answer: a block can be half filled and
 * still valid. A missing required answer only calls for attention once the block was started and
 * left, or visited and left without answering; open and unvisited empty blocks stay calm.
 */
export function onboardingStepProgress(
  progress: Omit<QuestionnaireBlockProgress, "blockId">,
  flags: { current: boolean; invalid: boolean; left: boolean },
): OnboardingStepStatus {
  const { answered, total, answeredRequired, totalRequired } = progress;
  const missingRequired = answeredRequired < totalRequired;
  const ratio = total === 0 ? 0 : Math.min(1, answered / total);
  const valid = !missingRequired && !flags.invalid;

  let kind: OnboardingStepStatusKind = OnboardingStepStatusKind.Incomplete;
  if (
    flags.invalid ||
    ((answered > 0 || flags.left) && missingRequired && !flags.current)
  )
    kind = OnboardingStepStatusKind.Attention;
  else if (answered === 0) kind = OnboardingStepStatusKind.Untouched;
  else if (answered >= total) kind = OnboardingStepStatusKind.Complete;

  return { kind, ratio, valid };
}
