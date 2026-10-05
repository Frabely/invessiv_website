"use client";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { FormFieldset, SecondaryCtaButton } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingScaleTrack } from "@/components/shared/onboarding/onboarding-scale-track/onboarding-scale-track";
import styles from "./onboarding-scale-field.module.css";

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
  const required = field.requirement === QuestionnaireFieldRequirement.Required;
  const poles = [...field.choices].sort(
    (left, right) => left.position - right.position,
  );
  const low = poles[0]?.label ?? null;
  const high = poles.length > 1 ? poles[poles.length - 1].label : null;

  return (
    <FormFieldset
      aria-required={required}
      className={styles.field}
      footer={
        !required && value !== "" ? (
          <div>
            <SecondaryCtaButton
              onClick={() => onChangeAction("")}
              size={ButtonSize.Control}
              type="button"
            >
              {texts.clearChoice}
            </SecondaryCtaButton>
          </div>
        ) : null
      }
      hint={field.help ?? undefined}
      label={field.label}
      required={required}
      role="radiogroup"
    >
      <OnboardingScaleTrack
        high={high}
        id={id}
        low={low}
        onChangeAction={onChangeAction}
        stepLabel={(step) =>
          formatMessage(texts.scale.step, {
            step,
            max: QUESTIONNAIRE_LIMITS.scaleSteps,
          })
        }
        value={value}
      />
      {low || high ? (
        <span className="sr-only">
          {[low, high].filter(Boolean).join(" – ")}
        </span>
      ) : null}
    </FormFieldset>
  );
}
