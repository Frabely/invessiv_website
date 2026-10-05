import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { isQuestionnaireChoiceAnswerType } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-answer-slot";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { LinkedText } from "@invessiv/ui";
import type { OnboardingReadTexts } from "@/common/contracts/shared/onboarding-read-texts";
import { OnboardingScaleTrack } from "../onboarding-scale-track/onboarding-scale-track";
import styles from "./onboarding-read-value.module.css";

export type OnboardingReadValueProps = {
  /** The answer rows of this field and entry; an empty list renders nothing. */
  answers: readonly QuestionnaireAnswerDto[];
  field: Pick<QuestionnaireResolvedField, "type" | "choices">;
  texts: OnboardingReadTexts;
};

/**
 * One answer, read-only: selected options by their label in display order, a confirmation as a
 * word, a colour with its swatch, a scale as its level between the poles, everything else as
 * plain text. Customer text only ever goes through `LinkedText`, never into markup.
 */
export function OnboardingReadValue({
  answers,
  field,
  texts,
}: OnboardingReadValueProps) {
  if (isQuestionnaireChoiceAnswerType(field.type)) {
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
  if (!value) return null;

  if (field.type === QuestionnaireFieldType.Confirmation)
    return <p className={styles.text}>{texts.confirmed}</p>;

  if (field.type === QuestionnaireFieldType.Color)
    return (
      <p className={styles.color}>
        <svg aria-hidden="true" className={styles.swatch} viewBox="0 0 20 20">
          <rect fill={value} height="20" rx="5" width="20" />
        </svg>
        {value}
      </p>
    );

  if (field.type === QuestionnaireFieldType.Scale) {
    const poles = [...field.choices].sort(
      (left, right) => left.position - right.position,
    );
    const low = poles[0]?.label ?? null;
    const high = poles.length > 1 ? poles[poles.length - 1].label : null;
    return (
      <div>
        {/* The track is the picture of the answer; the sentence below carries it for screen readers. */}
        <OnboardingScaleTrack compact high={high} low={low} value={value} />
        <p className="sr-only">
          {formatMessage(texts.scale, {
            step: value,
            max: QUESTIONNAIRE_LIMITS.scaleSteps,
          })}
          {low && high ? ` (${low} – ${high})` : null}
        </p>
      </div>
    );
  }

  return (
    <p className={styles.text}>
      <LinkedText text={value} />
    </p>
  );
}
