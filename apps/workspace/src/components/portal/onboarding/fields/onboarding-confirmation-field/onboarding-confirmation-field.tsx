"use client";

import { useId } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { CheckboxControl, FormFieldLabel } from "@invessiv/ui";
import styles from "./onboarding-confirmation-field.module.css";

export type OnboardingConfirmationFieldProps = {
  checked: boolean;
  field: QuestionnaireResolvedField;
  /** DOM id of the checkbox; a jump to this field focuses it. */
  id: string;
  onChangeAction: (checked: boolean) => void;
};

/** One statement the customer confirms with a tick; the statement itself is the label. */
export function OnboardingConfirmationField({
  checked,
  field,
  id,
  onChangeAction,
}: OnboardingConfirmationFieldProps) {
  const helpId = useId();
  const required = field.requirement === QuestionnaireFieldRequirement.Required;

  return (
    <div className={styles.field}>
      <label className={styles.statement} data-checked={checked}>
        <CheckboxControl
          aria-describedby={field.help ? helpId : undefined}
          aria-required={required}
          checked={checked}
          id={id}
          onChange={(event) => onChangeAction(event.target.checked)}
        />
        <FormFieldLabel label={field.label} required={required} />
      </label>
      {field.help ? (
        <p className={styles.help} id={helpId}>
          {field.help}
        </p>
      ) : null}
    </div>
  );
}
