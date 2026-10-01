import type { QuestionnaireProgressDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-progress.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingProgressTexts } from "@/common/contracts/shared/onboarding-progress-texts";
import styles from "./onboarding-progress-bar.module.css";

export type OnboardingProgressBarProps = {
  progress: Pick<
    QuestionnaireProgressDto,
    "answeredRequired" | "totalRequired"
  >;
  texts: OnboardingProgressTexts;
};

/** How many of the visible required answers are in. A form without any shows a full bar. */
export function OnboardingProgressBar({
  progress,
  texts,
}: OnboardingProgressBarProps) {
  const { answeredRequired, totalRequired } = progress;
  const label =
    totalRequired === 0
      ? texts.none
      : formatMessage(texts.label, {
          answered: answeredRequired,
          total: totalRequired,
        });

  return (
    <div className={styles.progress}>
      <progress
        aria-label={texts.barLabel}
        aria-valuetext={label}
        className={styles.bar}
        max={totalRequired || 1}
        value={totalRequired === 0 ? 1 : answeredRequired}
      />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
