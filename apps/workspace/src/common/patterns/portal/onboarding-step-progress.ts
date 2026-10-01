import { ProcessStepProgress } from "@invessiv/common/constants/ui/process-step-progress";
import type { QuestionnaireBlockProgress } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-progress";

/**
 * How the step track shows one block. The required answers decide: all given is complete, some
 * (or any answer at all) is partial. A block that requires nothing counts as done once the
 * customer answered something in it, so an untouched optional step is not ticked off.
 */
export function onboardingStepProgress(
  progress: Pick<
    QuestionnaireBlockProgress,
    "answeredRequired" | "totalRequired"
  >,
  hasAnswer: boolean,
): ProcessStepProgress {
  const { answeredRequired, totalRequired } = progress;
  if (totalRequired === 0)
    return hasAnswer ? ProcessStepProgress.Complete : ProcessStepProgress.Empty;
  if (answeredRequired >= totalRequired) return ProcessStepProgress.Complete;
  return answeredRequired > 0 || hasAnswer
    ? ProcessStepProgress.Partial
    : ProcessStepProgress.Empty;
}
