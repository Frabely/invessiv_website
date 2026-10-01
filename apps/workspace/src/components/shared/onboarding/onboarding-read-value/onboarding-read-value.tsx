import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { LinkedText } from "@invessiv/ui";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import styles from "./onboarding-read-value.module.css";

export type OnboardingReadValueProps = {
  /** The answer rows of this field and entry; an empty list renders nothing. */
  answers: readonly QuestionnaireAnswerDto[];
  field: Pick<QuestionnaireResolvedField, "type" | "choices">;
};

/**
 * One answer, read-only: selected options by their label in display order, everything else as
 * plain text. Customer text only ever goes through `LinkedText`, never into markup.
 */
export function OnboardingReadValue({
  answers,
  field,
}: OnboardingReadValueProps) {
  if (onboardingAnswerDrafts.isChoiceField(field)) {
    const selected = new Set(answers.map((answer) => answer.choiceId));
    const chosen = field.choices
      .filter((choice) => selected.has(choice.id))
      .sort((left, right) => left.position - right.position);
    if (chosen.length === 0) return null;
    if (chosen.length === 1)
      return <p className={styles.text}>{chosen[0].label}</p>;
    return (
      <ul className={styles.choices}>
        {chosen.map((choice) => (
          <li key={choice.id}>{choice.label}</li>
        ))}
      </ul>
    );
  }

  const value = answers.find((answer) => answer.value !== null)?.value;
  return value ? (
    <p className={styles.text}>
      <LinkedText text={value} />
    </p>
  ) : null;
}
