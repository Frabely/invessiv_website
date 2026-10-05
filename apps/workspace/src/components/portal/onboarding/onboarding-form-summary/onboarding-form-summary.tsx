import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { QuestionnaireCompleteness } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-form-summary.module.css";

export type OnboardingFormSummaryProps = {
  completeness: Pick<QuestionnaireCompleteness, "blocks" | "missing">;
  /** A visible input cannot be saved as it is, so the form is not ready whatever else is answered. */
  invalid: boolean;
  texts: PortalOnboardingDictionary["overview"];
};

/**
 * Where the form stands as a whole: how many questions are answered, and whether it could be
 * submitted right now. The two are separate on purpose, since optional questions may stay open.
 */
export function OnboardingFormSummary({
  completeness,
  invalid,
  texts,
}: OnboardingFormSummaryProps) {
  const answered = completeness.blocks.reduce(
    (sum, block) => sum + block.answered,
    0,
  );
  const total = completeness.blocks.reduce(
    (sum, block) => sum + block.total,
    0,
  );
  const missing = completeness.missing.length;
  const ready = missing === 0 && !invalid;

  return (
    <>
      <p className={styles.count}>
        {formatMessage(texts.answered, { answered, total })}
      </p>
      {ready || missing > 0 ? (
        <p className={styles.chip} data-ready={ready ? "true" : undefined}>
          {ready ? <FontAwesomeIcon aria-hidden="true" icon={faCheck} /> : null}
          {ready
            ? texts.ready
            : missing === 1
              ? texts.missingOne
              : formatMessage(texts.missingMany, { count: missing })}
        </p>
      ) : null}
    </>
  );
}
