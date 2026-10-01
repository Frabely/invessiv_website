import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import { OnboardingAnswerReadView } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { Locale } from "@/config/i18n";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-form-answers-tab.module.css";

export type OnboardingFormAnswersTabProps = {
  content: CrmOnboardingDictionary;
  form: OnboardingFormDto;
  /** Locale of the interface; block and field texts fall back to a maintained one. */
  locale: Locale;
};

/**
 * What the customer answered so far, read-only. The renderer is the one the portal shows after a
 * submission, fed with the same answers, so both sides read the same sheet.
 */
export function OnboardingFormAnswersTab({
  content,
  form,
  locale,
}: OnboardingFormAnswersTabProps) {
  const texts = content.answers;
  const input = {
    blocks: form.blocks.map((step) =>
      resolveQuestionnaireBlock(step.block, locale),
    ),
    answers: form.answers,
    answerFiles: form.answerFiles,
    groupEntries: form.groupEntries,
    servicesConfirmed: form.servicesConfirmedAt !== null,
  };

  return (
    <div className={styles.tab}>
      {input.blocks.length > 0 ? (
        <OnboardingProgressBar
          progress={getQuestionnaireCompleteness(input)}
          texts={texts.progress}
        />
      ) : null}
      <OnboardingAnswerReadView
        {...input}
        emptyText={texts.empty}
        texts={texts.read}
      />
    </div>
  );
}
