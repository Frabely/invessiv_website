import type { OnboardingFormDto } from "../../../contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireCompletenessInput } from "../../../contracts/crm/questionnaire/questionnaire-completeness-input";

type CompletenessSource = Pick<
  OnboardingFormDto,
  | "blocks"
  | "answers"
  | "answerFiles"
  | "hiddenAnswerFiles"
  | "groupEntries"
  | "servicesConfirmedAt"
>;

/**
 * What `getQuestionnaireCompleteness` needs of a form as a viewer received it. Files the viewer
 * may not open count as well: completeness must not depend on who looks, or a client would hold
 * back a form the server accepts.
 */
export function toOnboardingCompletenessInput(
  form: CompletenessSource,
): QuestionnaireCompletenessInput {
  return {
    blocks: form.blocks.map((step) => step.block),
    answers: form.answers,
    answerFiles: [...form.answerFiles, ...form.hiddenAnswerFiles],
    groupEntries: form.groupEntries,
    servicesConfirmed: form.servicesConfirmedAt !== null,
  };
}
