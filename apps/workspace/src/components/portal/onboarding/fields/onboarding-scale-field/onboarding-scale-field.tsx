"use client";

import { useId } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, FormFieldLabel } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-scale-field.module.css";

const STEPS = Array.from(
  { length: QUESTIONNAIRE_LIMITS.scaleSteps },
  (_, index) => String(index + 1),
);

export type OnboardingScaleFieldProps = {
  field: QuestionnaireResolvedField;
  /** DOM id of the first level; a jump to this field focuses it. */
  id: string;
  /** The chosen level as text, or an empty string to clear the answer. */
  onChangeAction: (value: string) => void;
  texts: PortalOnboardingDictionary["field"];
  /** The stored level, `"1"` to `"5"`; empty while unanswered. */
  value: string;
};

/**
 * A level between two poles. The two options of the field are only the pole labels; the answer is
 * the level. Native radios carry the keyboard: arrows move along the track.
 */
export function OnboardingScaleField({
  field,
  id,
  onChangeAction,
  texts,
  value,
}: OnboardingScaleFieldProps) {
  const labelId = useId();
  const helpId = useId();
  const required = field.requirement === QuestionnaireFieldRequirement.Required;
  const poles = [...field.choices].sort(
    (left, right) => left.position - right.position,
  );
  const low = poles[0]?.label ?? null;
  const high = poles.length > 1 ? poles[poles.length - 1].label : null;

  return (
    <div
      aria-describedby={field.help ? helpId : undefined}
      aria-labelledby={labelId}
      aria-required={required}
      className={styles.field}
      role="radiogroup"
    >
      <span className={styles.label} id={labelId}>
        <FormFieldLabel label={field.label} required={required} />
      </span>
      {field.help ? (
        <p className={styles.help} id={helpId}>
          {field.help}
        </p>
      ) : null}
      <div className={styles.track}>
        {STEPS.map((step, index) => (
          <label
            className={styles.step}
            data-checked={value === step ? "true" : undefined}
            key={step}
          >
            <input
              aria-label={formatMessage(texts.scale.step, {
                step,
                max: STEPS.length,
              })}
              checked={value === step}
              id={index === 0 ? id : undefined}
              name={id}
              onChange={() => onChangeAction(step)}
              type="radio"
            />
            <span aria-hidden="true">{step}</span>
          </label>
        ))}
      </div>
      {low || high ? (
        <div aria-hidden="true" className={styles.poles}>
          <span>{low}</span>
          <span>{high}</span>
        </div>
      ) : null}
      {low || high ? (
        <span className="sr-only">
          {[low, high].filter(Boolean).join(" – ")}
        </span>
      ) : null}
      {!required && value !== "" ? (
        <div>
          <ButtonControl
            onClick={() => onChangeAction("")}
            type="button"
            variant="ghost"
          >
            {texts.clearChoice}
          </ButtonControl>
        </div>
      ) : null}
    </div>
  );
}
